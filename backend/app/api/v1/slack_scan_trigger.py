import logging
import os
import tempfile
import shutil
import subprocess
import asyncio
from datetime import datetime, timezone
from typing import Tuple
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Scan
from app.models.scan_rule import ScanRule

logger = logging.getLogger(__name__)


async def _run_llm_scan_background(
    scan_id: int,
    user_id: int,
    repository_id: int,
    access_token: str,
    provider_type: str,
    priority_level: str = "all",
    max_files: int = 100
):
    """
    Background runner for LLM-based scan triggered from Slack.
    Uses a fresh DB session to avoid DetachedInstanceError / closed sessions.
    """
    from app.services.llm_scan_service import LLMScanService
    from app.services.slack_service import slack_service

    db = SessionLocal()
    temp_dir = None

    try:
        user = db.query(User).filter(User.id == user_id).first()
        repository = db.query(Repository).filter(Repository.id == repository_id).first()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()

        if not user or not repository or not scan:
            raise ValueError("User, repository, or scan not found")

        # Structured "scan started" notification
        if user.slack_bot_token:
            try:
                await slack_service.send_scan_started_notification(
                    user=user,
                    scan_id=scan_id,
                    repository_name=repository.full_name,
                    scan_type="llm_based",
                    priority_level=priority_level,
                    max_files=max_files
                )
            except Exception as notify_err:
                logger.warning(f"⚠️ Failed to send LLM scan-start notification: {notify_err}")

        # Currently supports github clone path
        if provider_type != "github":
            raise ValueError(f"LLM scan currently supports github provider only. Got: {provider_type}")

        if not repository.clone_url:
            raise ValueError("Repository clone_url is missing")

        # Clone repository into temp dir
        temp_dir = tempfile.mkdtemp(prefix=f"securethread_llm_scan_{scan_id}_")
        auth_clone_url = repository.clone_url.replace("https://", f"https://{access_token}@")

        clone_result = subprocess.run(
            ["git", "clone", "--depth=1", "--single-branch", auth_clone_url, temp_dir],
            capture_output=True,
            text=True,
            timeout=180
        )

        if clone_result.returncode != 0:
            raise RuntimeError(f"Git clone failed: {clone_result.stderr[:500]}")

        # Run LLM scan service
        llm_scan_service = LLMScanService(db)
        result = llm_scan_service.perform_llm_scan(
            scan_id=scan_id,
            repository=repository,
            max_files=max_files,
            priority=priority_level,
            repo_path=temp_dir
        )

        # Refresh scan for completion notification
        db.expire_all()
        updated_scan = db.query(Scan).filter(Scan.id == scan_id).first()

        if result.get("success"):
            if user.slack_bot_token and updated_scan:
                try:
                    duration_display = (
                        updated_scan.scan_duration
                        or (f"{int(updated_scan.scan_duration_seconds)}s"
                            if updated_scan.scan_duration_seconds else "N/A")
                    )
                    score_display = (
                        updated_scan.security_score
                        if updated_scan.security_score is not None
                        else 75.0
                    )

                    await slack_service.send_scan_complete_notification(
                        user=user,
                        scan_id=updated_scan.id,
                        repository_id=repository.id,
                        repository_name=repository.full_name,
                        status=updated_scan.status or "completed",
                        total_vulnerabilities=updated_scan.total_vulnerabilities or 0,
                        critical_count=updated_scan.critical_count or 0,
                        high_count=updated_scan.high_count or 0,
                        medium_count=updated_scan.medium_count or 0,
                        low_count=updated_scan.low_count or 0,
                        security_score=score_display,
                        scan_duration=duration_display
                    )
                except Exception as notify_err:
                    logger.warning(f"⚠️ Failed to send LLM completion notification: {notify_err}", exc_info=True)
        else:
            if user.slack_bot_token:
                try:
                    await slack_service.send_dm_to_user(
                        user=user,
                        text=(
                            f"❌ LLM scan failed for *{repository.full_name}*\n"
                            f"Reason: {result.get('error', 'Unknown error')}"
                        )
                    )
                except Exception:
                    pass

    except Exception as e:
        # Mark scan failed
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan and scan.status not in ["completed", "failed", "stopped"]:
                scan.status = "failed"
                scan.error_message = str(e)
                db.commit()
        except Exception:
            db.rollback()

        logger.error(f"❌ LLM background scan failed: {e}", exc_info=True)

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        db.close()


async def trigger_scan_from_slack(
    user: User,
    repository: Repository,
    db: Session,
    scan_type: str = "custom_rules"
) -> Tuple[bool, str, int]:
    """
    Trigger a security scan from Slack.

    Returns:
        Tuple of (success: bool, message: str, scan_id: int)
    """
    try:
        # Get appropriate access token
        access_token = None
        provider_type = repository.source_type

        if provider_type == "github":
            access_token = user.github_access_token
        elif provider_type == "bitbucket":
            access_token = user.bitbucket_access_token
        elif provider_type == "gitlab":
            access_token = user.gitlab_access_token

        if not access_token:
            return (
                False,
                f"No {provider_type} access token found. Please reconnect your account.",
                0
            )

        # Validate scan type
        if scan_type not in ["custom_rules", "llm_based"]:
            logger.warning(f"⚠️ Invalid scan_type '{scan_type}', defaulting to custom_rules")
            scan_type = "custom_rules"

        logger.info(f"🧠 Slack scan type requested: {scan_type}")

        # ─────────────────────────────────────────────────────────────
        # CUSTOM RULES SCAN BRANCH
        # ─────────────────────────────────────────────────────────────
        if scan_type == "custom_rules":
            rules_query = db.query(ScanRule).filter(
                ScanRule.is_active == True
            ).filter(
                (ScanRule.user_id == None) | (ScanRule.user_id == user.id)
            )

            rules = rules_query.order_by(ScanRule.execution_priority.desc()).all()

            if not rules:
                return (
                    False,
                    "No active scan rules found. Please add custom rules or enable global rules.",
                    0
                )

            rules_data = []
            user_custom_count = 0
            global_count = 0

            for rule in rules:
                rules_data.append({
                    "id": rule.id,
                    "user_id": rule.user_id,
                    "name": rule.name,
                    "description": rule.description,
                    "category": rule.category,
                    "severity": rule.severity,
                    "rule_content": rule.rule_content,
                    "cwe_id": rule.cwe_id,
                    "owasp_category": rule.owasp_category,
                    "language": rule.language,
                    "confidence_level": rule.confidence_level
                })

                if rule.user_id:
                    user_custom_count += 1
                else:
                    global_count += 1

            new_scan = Scan(
                repository_id=repository.id,
                user_id=user.id,
                scan_type="custom_rules",
                status="pending",
                started_at=datetime.now(timezone.utc),
                scan_metadata={
                    "scan_type": "custom_rules",
                    "rules_count": len(rules_data),
                    "user_custom_rules": user_custom_count,
                    "global_rules": global_count,
                    "llm_enhancement": True,
                    "language_filtering_enabled": True,
                    "initiated_by": user.id,
                    "initiated_from": "slack",
                    "provider_type": provider_type
                }
            )

            db.add(new_scan)
            db.commit()
            db.refresh(new_scan)

            logger.info(f"✅ Created custom scan {new_scan.id} for repository {repository.full_name} (via Slack)")
            logger.info(f"📋 Using {len(rules_data)} rules ({global_count} global, {user_custom_count} custom)")

            from app.api.v1.custom_scans import run_custom_scan_background

            asyncio.create_task(
                run_custom_scan_background(
                    scan_id=new_scan.id,
                    repository_id=repository.id,
                    access_token=access_token,
                    provider_type=provider_type,
                    rules_data=rules_data,
                    user_id=user.id,
                    use_llm_enhancement=True
                )
            )

            return (
                True,
                f"Custom rules scan initiated successfully for {repository.full_name}",
                new_scan.id
            )

        # ─────────────────────────────────────────────────────────────
        # LLM SCAN BRANCH
        # ─────────────────────────────────────────────────────────────
        elif scan_type == "llm_based":
            # Optional: be explicit early
            if provider_type != "github":
                return (
                    False,
                    "LLM-based Slack scan currently supports GitHub repositories only.",
                    0
                )

            new_scan = Scan(
                repository_id=repository.id,
                user_id=user.id,
                scan_type="llm_based",
                status="pending",
                started_at=datetime.now(timezone.utc),
                priority_level="all",
                max_files=100,
                llm_enhancement_enabled=True,
                scan_metadata={
                    "scan_type": "llm_based",
                    "initiated_by": user.id,
                    "initiated_from": "slack",
                    "provider_type": provider_type,
                    "priority_level": "all",
                    "max_files": 100
                }
            )

            db.add(new_scan)
            db.commit()
            db.refresh(new_scan)

            logger.info(f"✅ Created LLM scan {new_scan.id} for repository {repository.full_name} (via Slack)")

            asyncio.create_task(
                _run_llm_scan_background(
                    scan_id=new_scan.id,
                    user_id=user.id,
                    repository_id=repository.id,
                    access_token=access_token,
                    provider_type=provider_type,
                    priority_level="all",
                    max_files=100
                )
            )

            return (
                True,
                f"LLM scan initiated successfully for {repository.full_name}",
                new_scan.id
            )

        return (
            False,
            f"Unsupported scan type: {scan_type}",
            0
        )

    except Exception as e:
        logger.error(f"❌ Error triggering scan from Slack: {e}", exc_info=True)
        return (
            False,
            f"Failed to start scan: {str(e)[:100]}",
            0
        )
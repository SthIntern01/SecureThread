# backend/app/services/github_pr_service.py

import httpx
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime
import base64

from app.models.user import User
from app.models.repository import Repository
from app.models.vulnerability import Vulnerability
from app.utils.encryption import encrypt, decrypt

logger = logging.getLogger(__name__)


class GitHubPRService:
    """Service for creating GitHub Pull Requests with vulnerability fixes"""
    
    GITHUB_API_BASE = "https://api.github.com"
    
    def __init__(self, db: Session):
        self.db = db
    
    async def validate_pat_token(self, pat_token: str) -> Dict[str, Any]:
        """
        Validate GitHub Personal Access Token
        
        Returns:
            Dict with user info if valid, raises exception if invalid
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.GITHUB_API_BASE}/user",
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    logger.info(f"PAT token validated for GitHub user: {user_data.get('login')}")
                    return {
                        "valid": True,
                        "github_username": user_data.get("login"),
                        "github_id": user_data.get("id"),
                        "scopes": response.headers.get("X-OAuth-Scopes", "").split(", ")
                    }
                elif response.status_code == 401:
                    logger.warning("Invalid GitHub PAT token")
                    return {"valid": False, "error": "Invalid token"}
                else: 
                    logger.error(f"GitHub API error: {response.status_code}")
                    return {"valid": False, "error": f"GitHub API error: {response.status_code}"}
                    
        except httpx.TimeoutException:
            logger.error("GitHub API timeout during PAT validation")
            return {"valid": False, "error": "Request timeout"}
        except Exception as e:
            logger.error(f"Error validating PAT token: {str(e)}")
            return {"valid": False, "error": str(e)}
    
    async def save_pat_token(self, user_id: int, pat_token: str) -> bool:
        """
        Save encrypted PAT token to database
        
        Args:
            user_id: User ID
            pat_token: GitHub Personal Access Token (plain text)
            
        Returns: 
            True if successful
        """
        try:
            # Validate token first
            validation = await self.validate_pat_token(pat_token)
            if not validation.get("valid"):
                raise ValueError(f"Invalid PAT token: {validation.get('error')}")
            
            # Encrypt the token
            encrypted_token = encrypt(pat_token)
            
            # Update user record
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            user.github_pat_encrypted = encrypted_token
            user.github_pat_created_at = datetime.utcnow()
            
            self.db.commit()
            logger.info(f"PAT token saved for user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving PAT token: {str(e)}")
            raise
    
    async def get_pat_token(self, user_id: int) -> Optional[str]:
        """
        Retrieve and decrypt PAT token for user
        
        Returns:
            Decrypted PAT token or None if not found
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.github_pat_encrypted:
                return None
            
            # Decrypt token
            decrypted_token = decrypt(user.github_pat_encrypted)
            return decrypted_token
            
        except Exception as e:
            logger.error(f"Error retrieving PAT token: {str(e)}")
            return None
    
    async def delete_pat_token(self, user_id: int) -> bool:
        """Remove PAT token from database"""
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            user.github_pat_encrypted = None
            user.github_pat_created_at = None
            
            self.db.commit()
            logger.info(f"PAT token deleted for user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting PAT token: {str(e)}")
            return False
    
    async def get_file_content(
        self, 
        owner: str, 
        repo: str, 
        file_path: str, 
        branch: str, 
        pat_token: str
    ) -> Dict[str, Any]:
        """
        Fetch file content from GitHub repository
        
        Returns:
            Dict with content, sha, and encoding
        """
        try:
            url = f"{self.GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{file_path}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    params={"ref": branch},
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Decode base64 content
                    content = base64.b64decode(data["content"]).decode("utf-8")
                    
                    return {
                        "success": True,
                        "content": content,
                        "sha": data["sha"],
                        "encoding": data["encoding"]
                    }
                elif response.status_code == 404:
                    logger.warning(f"File not found: {file_path}")
                    return {"success": False, "error": "File not found"}
                else: 
                    logger.error(f"GitHub API error: {response.status_code}")
                    return {"success": False, "error": f"GitHub API error: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error fetching file content: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_branch(
        self, 
        owner: str, 
        repo: str, 
        branch_name: str, 
        base_branch: str, 
        pat_token: str
    ) -> Dict[str, Any]: 
        """
        Create a new branch in GitHub repository
        
        Returns: 
            Dict with success status and branch ref
        """
        try: 
            # Get base branch SHA
            base_ref_url = f"{self.GITHUB_API_BASE}/repos/{owner}/{repo}/git/ref/heads/{base_branch}"
            
            async with httpx.AsyncClient() as client:
                # Get base branch reference
                base_response = await client.get(
                    base_ref_url,
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    timeout=10.0
                )
                
                if base_response.status_code != 200:
                    return {"success": False, "error": "Base branch not found"}
                
                base_sha = base_response.json()["object"]["sha"]
                
                # Create new branch
                create_ref_url = f"{self.GITHUB_API_BASE}/repos/{owner}/{repo}/git/refs"
                
                create_response = await client.post(
                    create_ref_url,
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "ref": f"refs/heads/{branch_name}",
                        "sha": base_sha
                    },
                    timeout=10.0
                )
                
                if create_response.status_code == 201:
                    logger.info(f"Branch created: {branch_name}")
                    return {
                        "success": True,
                        "ref": create_response.json()["ref"],
                        "sha": base_sha
                    }
                elif create_response.status_code == 422:
                    # Branch already exists
                    logger.info(f"Branch already exists: {branch_name}")
                    return {"success": True, "ref": f"refs/heads/{branch_name}", "sha": base_sha}
                else:
                    error_msg = create_response.json().get("message", "Unknown error")
                    logger.error(f"Error creating branch: {error_msg}")
                    return {"success": False, "error": error_msg}
                    
        except Exception as e:
            logger.error(f"Error creating branch: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def commit_file_change(
        self,
        owner: str,
        repo: str,
        branch: str,
        file_path: str,
        new_content: str,
        commit_message: str,
        pat_token: str
    ) -> Dict[str, Any]:
        """
        Commit a file change to GitHub
        
        Returns:
            Dict with success status and commit info
        """
        try: 
            # Get current file SHA
            file_info = await self.get_file_content(owner, repo, file_path, branch, pat_token)
            
            if not file_info.get("success"):
                return {"success": False, "error": "Could not fetch current file"}
            
            file_sha = file_info["sha"]
            
            # Encode new content to base64
            encoded_content = base64.b64encode(new_content.encode("utf-8")).decode("utf-8")
            
            # Update file
            url = f"{self.GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{file_path}"
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    url,
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "message": commit_message,
                        "content": encoded_content,
                        "sha": file_sha,
                        "branch": branch
                    },
                    timeout=15.0
                )
                
                if response.status_code == 200:
                    commit_data = response.json()
                    logger.info(f"File committed: {file_path} on {branch}")
                    return {
                        "success": True,
                        "commit_sha": commit_data["commit"]["sha"],
                        "commit_url": commit_data["commit"]["html_url"]
                    }
                else:
                    error_msg = response.json().get("message", "Unknown error")
                    logger.error(f"Error committing file: {error_msg}")
                    return {"success": False, "error": error_msg}
                    
        except Exception as e:
            logger.error(f"Error committing file change: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_pull_request(
        self,
        owner: str,
        repo: str,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str,
        pat_token: str
    ) -> Dict[str, Any]:
        """
        Create a Pull Request on GitHub
        
        Returns: 
            Dict with PR number, URL, and status
        """
        try:
            url = f"{self.GITHUB_API_BASE}/repos/{owner}/{repo}/pulls"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers={
                        "Authorization": f"token {pat_token}",
                        "Accept": "application/vnd.github.v3+json"
                    },
                    json={
                        "title": title,
                        "body": body,
                        "head": head_branch,
                        "base": base_branch
                    },
                    timeout=15.0
                )
                
                if response.status_code == 201:
                    pr_data = response.json()
                    logger.info(f"Pull request created: #{pr_data['number']}")
                    return {
                        "success": True,
                        "pr_number": pr_data["number"],
                        "pr_url": pr_data["html_url"],
                        "pr_id": pr_data["id"],
                        "state": pr_data["state"]
                    }
                else: 
                    error_msg = response.json().get("message", "Unknown error")
                    errors = response.json().get("errors", [])
                    logger.error(f"Error creating PR: {error_msg} - {errors}")
                    return {"success": False, "error": error_msg, "details": errors}
                    
        except Exception as e:
            logger.error(f"Error creating pull request: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def create_fix_pull_request(
        self,
        user_id: int,
        repository_id: int,
        vulnerability_fix_ids: List[int],
        branch_name: Optional[str] = None,
        pr_title: Optional[str] = None,
        pr_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete workflow: Create branch, commit fixes, create PR
        
        This is the main method that ties everything together
        """
        try:
            # Get user's PAT token
            pat_token = await self.get_pat_token(user_id)
            if not pat_token:
                return {"success": False, "error": "GitHub PAT token not found. Please add it in settings."}
            
            # Get repository info
            repository = self.db.query(Repository).filter(Repository.id == repository_id).first()
            if not repository:
                return {"success": False, "error": "Repository not found"}
            
            # Parse owner/repo from full_name
            owner, repo_name = repository.full_name.split("/")
            base_branch = repository.default_branch or "main"
            
            # Get vulnerability fixes
            from app.models.vulnerability import VulnerabilityFix
            
            fixes = self.db.query(VulnerabilityFix).filter(
                VulnerabilityFix.id.in_(vulnerability_fix_ids),
                VulnerabilityFix.user_id == user_id
            ).all()
            
            if not fixes:
                return {"success": False, "error": "No fixes found"}
            
            # Generate branch name if not provided
            if not branch_name:
                timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
                branch_name = f"fix/security-vulnerabilities-{timestamp}"
            
            # Create branch
            logger.info(f"Creating branch: {branch_name}")
            branch_result = await self.create_branch(owner, repo_name, branch_name, base_branch, pat_token)
            
            if not branch_result.get("success"):
                return {"success": False, "error": f"Failed to create branch: {branch_result.get('error')}"}
            
            # Commit each fix
            committed_files = []
            for fix in fixes:
                commit_msg = f"Fix: {fix.vulnerability.title if fix.vulnerability else 'Security vulnerability'}"
                
                commit_result = await self.commit_file_change(
                    owner, repo_name, branch_name, fix.file_path,
                    fix.fixed_code, commit_msg, pat_token
                )
                
                if commit_result.get("success"):
                    committed_files.append(fix.file_path)
                    # Update fix status
                    fix.status = "pr_created"
                else:
                    logger.warning(f"Failed to commit {fix.file_path}: {commit_result.get('error')}")
            
            if not committed_files:
                return {"success": False, "error": "Failed to commit any fixes"}
            
            # Generate PR title and body
            if not pr_title:
                pr_title = f"🔒 Security Fix: {len(committed_files)} vulnerability{'ies' if len(committed_files) > 1 else 'y'} fixed"
            
            if not pr_description: 
                pr_description = self._generate_pr_description(fixes, committed_files)
            
            # Create Pull Request
            logger.info(f"Creating pull request: {pr_title}")
            pr_result = await self.create_pull_request(
                owner, repo_name, pr_title, pr_description,
                branch_name, base_branch, pat_token
            )
            
            if pr_result.get("success"):
                # Save PR record
                from app.models.vulnerability import PullRequest
                
                pr_record = PullRequest(
                    repository_id=repository_id,
                    user_id=user_id,
                    pr_number=pr_result["pr_number"],
                    pr_url=pr_result["pr_url"],
                    branch_name=branch_name,
                    title=pr_title,
                    description=pr_description,
                    fixes_included=[fix.id for fix in fixes],
                    status="open",
                    github_response=pr_result
                )
                
                self.db.add(pr_record)
                self.db.commit()
                
                logger.info(f"Pull request created successfully: {pr_result['pr_url']}")
                
                return {
                    "success": True,
                    "pr_number": pr_result["pr_number"],
                    "pr_url": pr_result["pr_url"],
                    "branch_name": branch_name,
                    "files_changed": committed_files,
                    "pr_id": pr_record.id
                }
            else:
                return {"success": False, "error": f"Failed to create PR: {pr_result.get('error')}"}
                
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error in create_fix_pull_request: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _generate_pr_description(self, fixes: List[Any], files: List[str]) -> str:
        """Generate formatted PR description"""
        description = "## 🔒 Security Vulnerability Fixes\n\n"
        description += "This PR addresses the following security vulnerabilities:\n\n"
        
        for i, fix in enumerate(fixes, 1):
            vuln = fix.vulnerability if hasattr(fix, 'vulnerability') else None
            description += f"### {i}. {vuln.title if vuln else 'Security Issue'}\n"
            description += f"- **Severity:** {vuln.severity if vuln else 'Unknown'}\n"
            description += f"- **File:** `{fix.file_path}`\n"
            description += f"- **Fix Type:** {fix.fix_type.replace('_', ' ').title()}\n\n"
        
        description += "---\n\n"
        description += "### Files Changed:\n"
        for file in files:
            description += f"- `{file}`\n"
        
        description += "\n---\n"
        description += "*This PR was automatically generated by SecureThread VMS*\n"
        
        return description
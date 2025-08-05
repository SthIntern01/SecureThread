#!/usr/bin/env python3
"""
Complete database cleanup script - Fix all scan issues
"""

import sys
from datetime import datetime, timedelta, timezone

# Add the project root to the path
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.vulnerability import Scan, Vulnerability

def complete_cleanup():
    """Complete cleanup of scan database"""
    db = SessionLocal()
    
    try:
        print("🧹 Starting complete database cleanup...")
        
        # 1. Find and fix stuck scans
        stuck_scans = db.query(Scan).filter(
            Scan.status.in_(["pending", "running"])
        ).all()
        
        print(f"🔍 Found {len(stuck_scans)} stuck scans")
        
        for scan in stuck_scans:
            print(f"  - Fixing Scan {scan.id} (Repository {scan.repository_id}) - Status: {scan.status}")
            
            scan.status = "failed"
            scan.completed_at = datetime.now(timezone.utc)
            scan.error_message = "Scan cleaned up - was stuck"
            
            if scan.scan_metadata:
                scan.scan_metadata["cleanup_reason"] = "Stuck scan cleanup"
            else:
                scan.scan_metadata = {"cleanup_reason": "Stuck scan cleanup"}
        
        # 2. Fix datetime issues in existing scans
        all_scans = db.query(Scan).all()
        print(f"🕐 Checking {len(all_scans)} scans for datetime issues...")
        
        for scan in all_scans:
            # Fix timezone-naive datetimes
            if scan.started_at and scan.started_at.tzinfo is None:
                scan.started_at = scan.started_at.replace(tzinfo=timezone.utc)
                print(f"  - Fixed started_at timezone for scan {scan.id}")
            
            if scan.completed_at and scan.completed_at.tzinfo is None:
                scan.completed_at = scan.completed_at.replace(tzinfo=timezone.utc)
                print(f"  - Fixed completed_at timezone for scan {scan.id}")
        
        # 3. Initialize missing scan_metadata
        scans_without_metadata = db.query(Scan).filter(Scan.scan_metadata.is_(None)).all()
        print(f"📝 Initializing metadata for {len(scans_without_metadata)} scans...")
        
        for scan in scans_without_metadata:
            scan.scan_metadata = {"initialized": True, "cleanup_date": datetime.now(timezone.utc).isoformat()}
            print(f"  - Initialized metadata for scan {scan.id}")
        
        # Commit all changes
        db.commit()
        print(f"✅ Database cleanup completed successfully!")
        
        # 4. Show final status
        print(f"\n📊 Final scan status:")
        final_scans = db.query(Scan).order_by(Scan.started_at.desc()).limit(10).all()
        
        for scan in final_scans:
            status_icon = {
                "completed": "✅",
                "failed": "❌", 
                "running": "🏃",
                "pending": "⏳"
            }.get(scan.status, "❓")
            
            vuln_count = db.query(Vulnerability).filter(Vulnerability.scan_id == scan.id).count()
            
            print(f"  {status_icon} Scan {scan.id} - {scan.status} - {vuln_count} vulnerabilities - {scan.started_at.strftime('%Y-%m-%d %H:%M:%S')}")
        
        print(f"\n🎯 Ready for fresh scanning!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    complete_cleanup()
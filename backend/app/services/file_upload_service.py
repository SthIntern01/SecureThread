# backend/app/services/file_upload_service.py

import os
import uuid
import hashlib
import tempfile
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from app.core.settings import settings

logger = logging.getLogger(__name__)

class FileUploadService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True)
        
        # Create subdirectories for organization
        (self.upload_dir / "temporary").mkdir(exist_ok=True)
        (self.upload_dir / "processed").mkdir(exist_ok=True)
        
    def validate_file(self, file: UploadFile) -> Dict[str, Any]:
        """Validate uploaded file for security and format checks"""
        # Check file size
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            file.file.seek(0, 2)  # Seek to end
            size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if size > settings.MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // (1024*1024)}MB"
                )
        
        # Check file extension
        if file.filename:
            file_ext = Path(file.filename).suffix.lower()
            if file_ext not in settings.ALLOWED_FILE_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_EXTENSIONS)}"
                )
        else:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": size if 'size' in locals() else None,
            "extension": file_ext
        }
    
    async def save_temporary_file(self, file: UploadFile) -> Dict[str, Any]:
        """Save uploaded file temporarily for processing"""
        try:
            # Validate file first
            validation_info = self.validate_file(file)
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            original_name = validation_info["filename"]
            extension = validation_info["extension"]
            temp_filename = f"{file_id}_{original_name}"
            temp_path = self.upload_dir / "temporary" / temp_filename
            
            # Read and save file content
            content = await file.read()
            
            # Calculate file hash for integrity
            file_hash = hashlib.sha256(content).hexdigest()
            
            # Save to temporary location
            with open(temp_path, "wb") as f:
                f.write(content)
            
            # Try to decode as text for code analysis
            try:
                # Try different encodings
                for encoding in ['utf-8', 'latin-1', 'cp1252']:
                    try:
                        text_content = content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    # If all encodings fail, treat as binary
                    text_content = None
            except Exception:
                text_content = None
            
            file_info = {
                "file_id": file_id,
                "original_name": original_name,
                "temp_path": str(temp_path),
                "size": len(content),
                "hash": file_hash,
                "extension": extension,
                "content_type": validation_info["content_type"],
                "text_content": text_content,
                "is_text": text_content is not None,
                "line_count": len(text_content.splitlines()) if text_content else 0
            }
            
            logger.info(f"Saved temporary file: {original_name} ({len(content)} bytes)")
            return file_info
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error saving temporary file: {e}")
            raise HTTPException(status_code=500, detail="Failed to save file")
    
    async def process_uploaded_files(self, files: List[UploadFile]) -> List[Dict[str, Any]]:
        """Process multiple uploaded files for vulnerability analysis"""
        processed_files = []
        
        for file in files:
            try:
                file_info = await self.save_temporary_file(file)
                
                # Additional processing for code files
                if file_info["is_text"] and file_info["text_content"]:
                    # Basic code analysis metadata
                    content = file_info["text_content"]
                    
                    # Count lines of actual code (non-empty, non-comment)
                    lines = content.splitlines()
                    code_lines = []
                    comment_lines = []
                    
                    for line in lines:
                        stripped = line.strip()
                        if not stripped:
                            continue
                        elif stripped.startswith(('#', '//', '/*', '*', '<--')):
                            comment_lines.append(line)
                        else:
                            code_lines.append(line)
                    
                    # Extract imports/includes
                    imports = []
                    for line in lines[:50]:  # Check first 50 lines for imports
                        stripped = line.strip()
                        if any(stripped.startswith(keyword) for keyword in [
                            'import ', 'from ', 'include ', '#include', 'require', 'use '
                        ]):
                            imports.append(stripped)
                    
                    file_info.update({
                        "total_lines": len(lines),
                        "code_lines": len(code_lines),
                        "comment_lines": len(comment_lines),
                        "imports": imports[:10],  # Limit to first 10 imports
                        "preview": content[:500] + "..." if len(content) > 500 else content
                    })
                
                processed_files.append(file_info)
                
            except HTTPException as e:
                # Add error info but continue processing other files
                processed_files.append({
                    "original_name": getattr(file, 'filename', 'unknown'),
                    "error": e.detail,
                    "status": "error"
                })
        
        return processed_files
    
    def cleanup_temporary_files(self, file_ids: List[str]):
        """Clean up temporary files after processing"""
        for file_id in file_ids:
            try:
                # Find and remove temporary files with this file_id
                temp_dir = self.upload_dir / "temporary"
                for temp_file in temp_dir.glob(f"{file_id}_*"):
                    temp_file.unlink()
                    logger.info(f"Cleaned up temporary file: {temp_file}")
            except Exception as e:
                logger.error(f"Error cleaning up file {file_id}: {e}")
    
    def get_file_content(self, file_path: str) -> Optional[str]:
        """Safely read file content for analysis"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    return f.read()
            except Exception:
                return None
        except Exception:
            return None
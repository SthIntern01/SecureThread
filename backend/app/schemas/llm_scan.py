"""
Pydantic schemas for LLM-based scanning
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class LLMScanConfigRequest(BaseModel):
    """Request schema for LLM-based scan configuration"""
    repository_id: int
    max_files: int = Field(default=50, ge=1, le=500)
    priority_level: str = Field(default="all", pattern="^(critical|high|medium|low|all)$")
    
    @validator('priority_level')
    def validate_priority(cls, v):
        allowed = ['critical', 'high', 'medium', 'low', 'all']
        if v.lower() not in allowed:
            raise ValueError(f'Priority must be one of: {", ".join(allowed)}')
        return v.lower()


class LLMScanResponse(BaseModel):
    """Response schema for initiated LLM scan"""
    scan_id: int
    message: str
    repository_id: int
    scan_type: str
    priority_level: str
    max_files: int
    estimated_time_seconds: int
    
    class Config:
        from_attributes = True


class LLMVulnerabilityDetail(BaseModel):
    """Detailed vulnerability information from LLM"""
    id: int
    title: str
    description: str
    severity: str
    category: Optional[str]
    file_path: str
    line_number: Optional[int]
    line_end_number: Optional[int]
    code_snippet: Optional[str]
    
    # LLM-specific fields
    llm_explanation: Optional[str]
    llm_solution: Optional[str]
    llm_code_example: Optional[str]
    confidence_score: Optional[float]
    
    detection_method: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LLMScanResultResponse(BaseModel):
    """Complete scan result with all details"""
    scan_id: int
    scan_type: str
    status: str
    repository_name: str
    
    # Scan statistics
    total_files_scanned: int
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    
    # LLM-specific metrics
    llm_model_used: Optional[str]
    total_tokens_used: int
    estimated_cost: float
    
    # Timing
    scan_duration_seconds: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    # Vulnerabilities
    vulnerabilities: List[LLMVulnerabilityDetail]
    
    class Config:
        from_attributes = True


class TokenUsageStats(BaseModel):
    """Token usage statistics"""
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    estimated_cost_usd: float
    model_used: str


class LLMScanProgress(BaseModel):
    """Real-time scan progress"""
    scan_id: int
    status: str
    progress_percentage: int
    current_file: Optional[str]
    files_completed: int
    total_files: int
    vulnerabilities_found: int
    elapsed_time_seconds: float
    estimated_remaining_seconds: Optional[float]
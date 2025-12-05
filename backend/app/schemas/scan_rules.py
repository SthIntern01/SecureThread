"""
Pydantic schemas for scan rules API
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class ScanRuleBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    rule_content: str = Field(..., min_length=10)
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    language: Optional[str] = 'multi'
    confidence_level: Optional[str] = Field(None, pattern="^(high|medium|low)$")
    tags: Optional[List[str]] = []
    execution_priority: Optional[int] = Field(50, ge=1, le=100)


class ScanRuleCreate(ScanRuleBase):
    """Schema for creating a new scan rule"""
    pass


class ScanRuleUpdate(BaseModel):
    """Schema for updating an existing scan rule"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    rule_content: Optional[str] = Field(None, min_length=10)
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    execution_priority: Optional[int] = Field(None, ge=1, le=100)


class ScanRuleResponse(BaseModel):
    """Schema for scan rule response"""
    id: int
    user_id: Optional[int]  # None for global rules, user ID for custom rules
    name: str
    description: Optional[str]
    category: str
    severity: str
    rule_content: str
    is_active: bool
    cwe_id: Optional[str]
    owasp_category: Optional[str]
    language: str
    confidence_level: str
    tags: List[str]
    execution_priority: int
    total_detections: Optional[int] = 0
    true_positive_count: Optional[int] = 0
    false_positive_count: Optional[int] = 0
    false_positive_rate: Optional[float] = 0.0
    avg_execution_time_ms: Optional[float] = 0.0
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ScanRuleValidationRequest(BaseModel):
    """Schema for validating rule content"""
    rule_content: str = Field(..., min_length=10)


class ScanRuleValidationResponse(BaseModel):
    """Schema for rule validation response"""
    valid: bool
    errors: List[str] = []
    patterns_count: int = 0
    message: str


class RuleCategoryResponse(BaseModel):
    """Schema for rule category"""
    name: str
    count: int
    severity_distribution: dict


class RuleStatsResponse(BaseModel):
    """Schema for rule statistics"""
    total_rules: int
    active_rules: int
    user_custom_rules: int
    global_rules: int
    by_category: List[RuleCategoryResponse]
    by_severity: dict
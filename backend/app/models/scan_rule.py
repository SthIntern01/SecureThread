from sqlalchemy import Column, Integer, String, Text, Boolean, Float, JSON, DateTime, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ScanRule(Base):
    """
    Scan rules for vulnerability detection
    Supports both global rules and user-specific custom rules
    """
    __tablename__ = "scan_rules"

    id = Column(Integer, primary_key=True, index=True)
    
    # User ID for custom rules (NULL = global rule)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    rule_content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    
    # CWE and OWASP mapping
    cwe_id = Column(String(20), nullable=True)
    owasp_category = Column(String(100), nullable=True)
    
    # Technical details
    language = Column(String(50), default='multi')
    confidence_level = Column(String(20), default='medium')
    false_positive_rate = Column(Float, default=0.0)
    
    # Metadata
    tags = Column(ARRAY(String), default=[])
    execution_priority = Column(Integer, default=50)
    
    # Performance metrics
    total_detections = Column(Integer, default=0)
    true_positive_count = Column(Integer, default=0)
    false_positive_count = Column(Integer, default=0)
    avg_execution_time_ms = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships - FIXED: Use back_populates instead of backref
    user = relationship("User", back_populates="custom_scan_rules")
    
    def __repr__(self):
        rule_type = "Custom" if self.user_id else "Global"
        return f"<ScanRule({rule_type}: {self.name}, {self.severity})>"
    
    @property
    def is_custom(self) -> bool:
        """Check if this is a user custom rule"""
        return self.user_id is not None
    
    @property
    def is_global(self) -> bool:
        """Check if this is a global rule"""
        return self.user_id is None
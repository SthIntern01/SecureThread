# backend/app/utils/encryption.py - COMPLETE FILE

import os
import base64
import logging
from dotenv import load_dotenv
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get encryption key from environment variable
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "")

if not ENCRYPTION_KEY: 
    logger.warning("ENCRYPTION_KEY not found in environment, generating temporary key")
    ENCRYPTION_KEY = Fernet.generate_key().decode()


def _get_fernet_key() -> bytes:
    """
    Derive a Fernet key from the encryption key
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'securethread_salt_2024',
        iterations=100_000,
        backend=default_backend()
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))  # Fixed: removed space before .encode()
    return key


def encrypt(plain_text: str) -> str:
    """
    Encrypt sensitive data (like GitHub PAT tokens)
    
    Args:
        plain_text: Plain text string to encrypt
        
    Returns: 
        Encrypted string (base64 encoded)
    """
    if not plain_text:
        return None
    
    try: 
        fernet_key = _get_fernet_key()
        fernet = Fernet(fernet_key)
        
        encrypted_bytes = fernet.encrypt(plain_text.encode('utf-8'))
        
        return encrypted_bytes.decode('utf-8')
        
    except Exception as e:
        logger.error(f"Encryption error: {str(e)}")
        raise ValueError(f"Failed to encrypt data: {str(e)}")


def decrypt(encrypted_text: str) -> str:
    """
    Decrypt encrypted data
    
    Args:
        encrypted_text: Encrypted string (base64 encoded)
        
    Returns: 
        Decrypted plain text string
    """
    if not encrypted_text:
        return None
    
    try:
        fernet_key = _get_fernet_key()
        fernet = Fernet(fernet_key)
        
        decrypted_bytes = fernet.decrypt(encrypted_text.encode('utf-8'))  # Fixed: removed space before .decrypt()
        
        return decrypted_bytes.decode('utf-8')
        
    except Exception as e:
        logger.error(f"Decryption error: {str(e)}")
        raise ValueError(f"Failed to decrypt data: {str(e)}")


def is_encrypted(data: str) -> bool:
    """
    Check if a string appears to be encrypted
    
    Args:
        data: String to check
        
    Returns:
        True if data looks encrypted, False otherwise
    """
    if not data or not isinstance(data, str):
        return False
    
    try:
        return data.startswith('gAAAAA')
    except:
        return False
import httpx
import requests
from typing import Optional, List, Dict, Any
from app.config.settings import settings
import logging
from urllib.parse import quote, urlencode

logger = logging.getLogger(__name__)

class GitLabService:
    def __init__(self):
        self.client_id = settings.GITLAB_CLIENT_ID
        self.client_secret = settings.GITLAB_CLIENT_SECRET
        self.redirect_uri = settings.GITLAB_REDIRECT_URI
        self.api_base_url = "https://gitlab.com/api/v4"

    @classmethod
    def get_authorization_url(cls) -> str:
        """Get GitLab OAuth authorization URL"""
        params = {
            "client_id": settings.GITLAB_CLIENT_ID,
            "redirect_uri": settings.GITLAB_REDIRECT_URI,
            "response_type": "code",
            "scope": "read_user read_api read_repository",
            "state": "securethread_gitlab_auth"
        }
        auth_url = f"https://gitlab.com/oauth/authorize?{urlencode(params)}"
        return auth_url

    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://gitlab.com/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            else:
                logger.error(f"Failed to exchange code: {response.text}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitLab"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base_url}/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                return response.json()
            logger.error(f"Failed to get user info: {response.text}")
            return None

    def get_user_projects(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user projects from GitLab"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            projects = []
            page = 1
            per_page = 100

            while True:
                response = requests.get(
                    f"{self.api_base_url}/projects",
                    headers=headers,
                    params={"page": page, "per_page": per_page, "membership": True, "order_by": "last_activity_at"}
                )

                if response.status_code != 200:
                    logger.error(f"Error fetching projects: {response.text}")
                    break

                page_projects = response.json()
                if not page_projects:
                    break

                for project in page_projects:
                    projects.append({
                        "id": project["id"],
                        "name": project["name"],
                        "description": project.get("description"),
                        "web_url": project["web_url"],
                        "http_url_to_repo": project["http_url_to_repo"],
                        "default_branch": project.get("default_branch"),
                        "visibility": project["visibility"],
                        "created_at": project["created_at"],
                        "last_activity_at": project["last_activity_at"]
                    })

                if len(page_projects) < per_page:
                    break
                page += 1

            return projects
        except Exception as e:
            logger.error(f"Error fetching GitLab projects: {e}")
            return []

    def get_repository_tree(self, access_token: str, project_id: int) -> Optional[List[Dict[str, Any]]]:
        """Get repository tree for a GitLab project"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(
                f"{self.api_base_url}/projects/{project_id}/repository/tree",
                headers=headers,
                params={"recursive": True}
            )
            if response.status_code == 200:
                return response.json()
            logger.error(f"Failed to fetch repo tree: {response.text}")
            return None
        except Exception as e:
            logger.error(f"Error fetching repo tree: {e}")
            return None

    def get_file_content(self, access_token: str, project_id: int, file_path: str, ref: str = "main") -> Optional[str]:
        try:
            headers = {"Authorization": f"Bearer {access_token}"}

            # Encode file path to handle spaces, special chars, etc.
            encoded_path = quote(file_path, safe='')

            url = f"{self.api_base_url}/projects/{project_id}/repository/files/{encoded_path}"
            response = requests.get(url, headers=headers, params={"ref": ref})

            if response.status_code == 200:
                file_data = response.json()
                import base64
                return base64.b64decode(file_data["content"]).decode("utf-8", errors="replace")

            logger.error(f"Failed to fetch file: {response.text}")
            return None

        except Exception as e:
            logger.error(f"Error fetching file content: {e}")
            return None

    def validate_token(self, access_token: str) -> bool:
        """Validate if the GitLab token is valid"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{self.api_base_url}/user", headers=headers)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return False
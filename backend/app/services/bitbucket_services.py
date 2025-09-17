import httpx
import requests
from typing import Optional, List, Dict, Any
from app.config.settings import settings
import logging
from urllib.parse import quote, urlencode
import base64

logger = logging.getLogger(__name__)

class BitbucketService:
    def __init__(self):
        self.client_id = settings.BITBUCKET_CLIENT_ID
        self.client_secret = settings.BITBUCKET_CLIENT_SECRET
        self.redirect_uri = settings.BITBUCKET_REDIRECT_URI
        self.api_base_url = "https://api.bitbucket.org/2.0"

    @classmethod
    def get_authorization_url(cls) -> str:
        """Get Bitbucket OAuth authorization URL"""
        params = {
            "client_id": settings.BITBUCKET_CLIENT_ID,
            "response_type": "code",
            "state": "securethread_bitbucket_auth",
            "scope": "account repository"  # Changed from "account repositories"
        }
        auth_url = f"https://bitbucket.org/site/oauth2/authorize?{urlencode(params)}"
        return auth_url

    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            # Bitbucket requires Basic Auth with client credentials
            auth_header = base64.b64encode(
                f"{self.client_id}:{self.client_secret}".encode()
            ).decode()
            
            response = await client.post(
                "https://bitbucket.org/site/oauth2/access_token",
                headers={
                    "Authorization": f"Basic {auth_header}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={
                    "grant_type": "authorization_code",
                    "code": code
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            else:
                logger.error(f"Failed to exchange code: {response.text}")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Bitbucket"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base_url}/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                return response.json()
            logger.error(f"Failed to get user info: {response.text}")
            return None

    def get_user_repositories(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user repositories from Bitbucket"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            repositories = []
            url = f"{self.api_base_url}/repositories"
            
            # Get user info first to get the username
            user_info_response = requests.get(f"{self.api_base_url}/user", headers=headers)
            if user_info_response.status_code != 200:
                logger.error(f"Failed to get user info: {user_info_response.text}")
                return []
            
            username = user_info_response.json().get("username")
            if not username:
                logger.error("Could not get username from user info")
                return []

            # Get repositories for the user
            url = f"{self.api_base_url}/repositories/{username}"
            page = 1
            pagelen = 50

            while True:
                response = requests.get(
                    url,
                    headers=headers,
                    params={"page": page, "pagelen": pagelen, "sort": "-updated_on"}
                )

                if response.status_code != 200:
                    logger.error(f"Error fetching repositories: {response.text}")
                    break

                data = response.json()
                page_repos = data.get("values", [])
                
                if not page_repos:
                    break

                for repo in page_repos:
                    repositories.append({
                        "id": repo["uuid"],  # Bitbucket uses UUID for repo ID
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "description": repo.get("description"),
                        "html_url": repo["links"]["html"]["href"],
                        "clone_url": repo["links"]["clone"][0]["href"] if repo["links"]["clone"] else "",
                        "default_branch": repo.get("mainbranch", {}).get("name", "main"),
                        "language": repo.get("language"),
                        "is_private": repo["is_private"],
                        "created_at": repo["created_on"],
                        "updated_at": repo["updated_on"]
                    })

                # Check if there are more pages
                if "next" not in data:
                    break
                page += 1

            return repositories
        except Exception as e:
            logger.error(f"Error fetching Bitbucket repositories: {e}")
            return []

    def get_repository_tree(self, access_token: str, workspace: str, repo_slug: str, branch: str = None) -> Optional[List[Dict[str, Any]]]:
        """Get repository tree for a Bitbucket repository"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # If no branch specified, get the default branch
            if not branch:
                repo_response = requests.get(
                    f"{self.api_base_url}/repositories/{workspace}/{repo_slug}",
                    headers=headers
                )
                if repo_response.status_code == 200:
                    repo_data = repo_response.json()
                    branch = repo_data.get("mainbranch", {}).get("name", "main")
                else:
                    branch = "main"  # fallback
            
            # Get the repository tree
            tree_url = f"{self.api_base_url}/repositories/{workspace}/{repo_slug}/src/{branch}"
            tree_items = []
            
            def fetch_tree_recursive(url_path: str = ""):
                """Recursively fetch tree items"""
                full_url = f"{tree_url}/{url_path}" if url_path else tree_url
                response = requests.get(full_url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    for item in data.get("values", []):
                        tree_items.append({
                            "path": item["path"],
                            "type": item["type"],  # "commit_file" or "commit_directory"
                            "size": item.get("size"),
                            "mime_type": item.get("mimetype")
                        })
                        
                        # If it's a directory, fetch its contents
                        if item["type"] == "commit_directory":
                            fetch_tree_recursive(item["path"])
            
            fetch_tree_recursive()
            return tree_items
            
        except Exception as e:
            logger.error(f"Error fetching repo tree: {e}")
            return None

    def get_file_content(self, access_token: str, workspace: str, repo_slug: str, file_path: str, branch: str = "main") -> Optional[str]:
        """Get file content from Bitbucket repository"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Encode file path to handle spaces, special chars, etc.
            encoded_path = quote(file_path, safe='/')
            
            url = f"{self.api_base_url}/repositories/{workspace}/{repo_slug}/src/{branch}/{encoded_path}"
            response = requests.get(url, headers=headers)

            if response.status_code == 200:
                # Bitbucket returns file content directly, not base64 encoded
                return response.text
            
            logger.error(f"Failed to fetch file: {response.text}")
            return None

        except Exception as e:
            logger.error(f"Error fetching file content: {e}")
            return None

    def validate_token(self, access_token: str) -> bool:
        """Validate if the Bitbucket token is valid"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{self.api_base_url}/user", headers=headers)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return False

    def get_repository_details(self, access_token: str, workspace: str, repo_slug: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific repository"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(
                f"{self.api_base_url}/repositories/{workspace}/{repo_slug}",
                headers=headers
            )
            
            if response.status_code == 200:
                repo_data = response.json()
                return {
                    "id": repo_data["uuid"],
                    "name": repo_data["name"],
                    "full_name": repo_data["full_name"],
                    "description": repo_data.get("description"),
                    "html_url": repo_data["links"]["html"]["href"],
                    "clone_url": repo_data["links"]["clone"][0]["href"] if repo_data["links"]["clone"] else "",
                    "default_branch": repo_data.get("mainbranch", {}).get("name", "main"),
                    "language": repo_data.get("language"),
                    "is_private": repo_data["is_private"],
                    "created_at": repo_data["created_on"],
                    "updated_at": repo_data["updated_on"],
                    "size": repo_data.get("size", 0)
                }
            
            logger.error(f"Failed to fetch repository details: {response.text}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching repository details: {e}")
            return None
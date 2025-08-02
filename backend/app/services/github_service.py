import httpx
import requests
from typing import Optional, List, Dict, Any
from github import Github
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class GitHubService:
    def __init__(self):
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.redirect_uri = settings.GITHUB_REDIRECT_URI

    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            return None

    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitHub"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "SecureThread-App/1.0"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            return None

    async def get_user_email(self, access_token: str) -> Optional[str]:
        """Get primary email from GitHub"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "SecureThread-App/1.0"
                }
            )
            
            if response.status_code == 200:
                emails = response.json()
                for email in emails:
                    if email.get("primary", False):
                        return email.get("email")
            return None

    def get_user_repositories(self, access_token: str) -> List[Dict[str, Any]]:
        """Get user repositories using requests for better error handling"""
        try:
            # Use requests for synchronous call since this is called from sync endpoint
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SecureThread-App/1.0"
            }
            
            repos = []
            page = 1
            per_page = 100
            
            logger.info(f"Starting to fetch repositories for user")
            
            while True:
                url = f"https://api.github.com/user/repos"
                params = {
                    "page": page,
                    "per_page": per_page,
                    "sort": "updated",
                    "affiliation": "owner,collaborator,organization_member"
                }
                
                logger.info(f"Fetching repositories from: {url} with params: {params}")
                
                try:
                    response = requests.get(
                        url, 
                        headers=headers, 
                        params=params,
                        timeout=30
                    )
                    
                    logger.info(f"GitHub API response status: {response.status_code}")
                    
                    if response.status_code == 401:
                        logger.error("GitHub API authentication failed - invalid token")
                        raise Exception("Invalid GitHub token")
                    
                    if response.status_code == 403:
                        logger.error(f"GitHub API rate limit exceeded: {response.headers.get('X-RateLimit-Remaining', 'unknown')} remaining")
                        raise Exception("GitHub API rate limit exceeded")
                    
                    if response.status_code != 200:
                        logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                        break
                    
                    page_repos = response.json()
                    
                    if not page_repos:
                        logger.info("No more repositories found, breaking pagination loop")
                        break
                    
                    logger.info(f"Fetched {len(page_repos)} repositories on page {page}")
                    
                    for repo in page_repos:
                        try:
                            repo_data = {
                                "id": repo["id"],
                                "name": repo["name"],
                                "full_name": repo["full_name"],
                                "description": repo.get("description"),
                                "html_url": repo["html_url"],
                                "clone_url": repo["clone_url"],
                                "default_branch": repo.get("default_branch", "main"),
                                "language": repo.get("language"),
                                "private": repo["private"],
                                "fork": repo["fork"],
                                "created_at": repo["created_at"],
                                "updated_at": repo["updated_at"],
                                "size": repo.get("size", 0),
                                "stargazers_count": repo.get("stargazers_count", 0),
                                "forks_count": repo.get("forks_count", 0),
                                "open_issues_count": repo.get("open_issues_count", 0),
                                "topics": repo.get("topics", []),
                                "visibility": repo.get("visibility", "private" if repo["private"] else "public"),
                                "archived": repo.get("archived", False),
                                "disabled": repo.get("disabled", False),
                            }
                            repos.append(repo_data)
                        except KeyError as e:
                            logger.warning(f"Missing key in repository data: {e}, skipping repository {repo.get('name', 'unknown')}")
                            continue
                    
                    # If we got fewer repos than per_page, we're done
                    if len(page_repos) < per_page:
                        logger.info(f"Received {len(page_repos)} repositories, less than {per_page}, pagination complete")
                        break
                    
                    page += 1
                    
                    # Safety check to prevent infinite loops
                    if page > 50:  # Max 5000 repos
                        logger.warning("Reached maximum page limit (50), stopping pagination")
                        break
                        
                except requests.exceptions.Timeout:
                    logger.error("Request to GitHub API timed out")
                    break
                except requests.exceptions.ConnectionError:
                    logger.error("Connection error while fetching from GitHub API")
                    break
                except requests.exceptions.RequestException as e:
                    logger.error(f"Request exception: {e}")
                    break
            
            logger.info(f"Successfully fetched {len(repos)} repositories total")
            return repos
            
        except Exception as e:
            logger.error(f"Error fetching repositories: {e}")
            return []

    async def get_user_repositories_async(self, access_token: str) -> List[Dict[str, Any]]:
        """Async version of get_user_repositories for async contexts"""
        try:
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SecureThread-App/1.0"
            }
            
            repos = []
            page = 1
            per_page = 100
            
            logger.info(f"Starting to fetch repositories for user (async)")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                while True:
                    url = f"https://api.github.com/user/repos"
                    params = {
                        "page": page,
                        "per_page": per_page,
                        "sort": "updated",
                        "affiliation": "owner,collaborator,organization_member"
                    }
                    
                    logger.info(f"Fetching repositories from: {url} with params: {params}")
                    
                    try:
                        response = await client.get(url, headers=headers, params=params)
                        
                        logger.info(f"GitHub API response status: {response.status_code}")
                        
                        if response.status_code == 401:
                            logger.error("GitHub API authentication failed - invalid token")
                            raise Exception("Invalid GitHub token")
                        
                        if response.status_code == 403:
                            logger.error(f"GitHub API rate limit exceeded")
                            raise Exception("GitHub API rate limit exceeded")
                        
                        if response.status_code != 200:
                            logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                            break
                        
                        page_repos = response.json()
                        
                        if not page_repos:
                            logger.info("No more repositories found, breaking pagination loop")
                            break
                        
                        logger.info(f"Fetched {len(page_repos)} repositories on page {page}")
                        
                        for repo in page_repos:
                            try:
                                repo_data = {
                                    "id": repo["id"],
                                    "name": repo["name"],
                                    "full_name": repo["full_name"],
                                    "description": repo.get("description"),
                                    "html_url": repo["html_url"],
                                    "clone_url": repo["clone_url"],
                                    "default_branch": repo.get("default_branch", "main"),
                                    "language": repo.get("language"),
                                    "private": repo["private"],
                                    "fork": repo["fork"],
                                    "created_at": repo["created_at"],
                                    "updated_at": repo["updated_at"],
                                    "size": repo.get("size", 0),
                                    "stargazers_count": repo.get("stargazers_count", 0),
                                    "forks_count": repo.get("forks_count", 0),
                                    "open_issues_count": repo.get("open_issues_count", 0),
                                    "topics": repo.get("topics", []),
                                    "visibility": repo.get("visibility", "private" if repo["private"] else "public"),
                                    "archived": repo.get("archived", False),
                                    "disabled": repo.get("disabled", False),
                                }
                                repos.append(repo_data)
                            except KeyError as e:
                                logger.warning(f"Missing key in repository data: {e}, skipping repository {repo.get('name', 'unknown')}")
                                continue
                        
                        # If we got fewer repos than per_page, we're done
                        if len(page_repos) < per_page:
                            logger.info(f"Received {len(page_repos)} repositories, less than {per_page}, pagination complete")
                            break
                        
                        page += 1
                        
                        # Safety check to prevent infinite loops
                        if page > 50:  # Max 5000 repos
                            logger.warning("Reached maximum page limit (50), stopping pagination")
                            break
                            
                    except httpx.TimeoutException:
                        logger.error("Request to GitHub API timed out")
                        break
                    except httpx.ConnectError:
                        logger.error("Connection error while fetching from GitHub API")
                        break
                    except httpx.RequestError as e:
                        logger.error(f"Request exception: {e}")
                        break
            
            logger.info(f"Successfully fetched {len(repos)} repositories total (async)")
            return repos
            
        except Exception as e:
            logger.error(f"Error fetching repositories (async): {e}")
            return []

    def get_repository_content(self, access_token: str, repo_full_name: str, path: str = "") -> Optional[List[Dict[str, Any]]]:
        """Get repository content for scanning"""
        try:
            g = Github(access_token)
            repo = g.get_repo(repo_full_name)
            contents = repo.get_contents(path)
            
            if not isinstance(contents, list):
                contents = [contents]
            
            result = []
            for content in contents:
                result.append({
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                    "size": content.size,
                    "download_url": content.download_url,
                })
            
            return result
        except Exception as e:
            logger.error(f"Error fetching repository content: {e}")
            return None

    def get_repository_info(self, access_token: str, repo_full_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific repository"""
        try:
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SecureThread-App/1.0"
            }
            
            url = f"https://api.github.com/repos/{repo_full_name}"
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                repo = response.json()
                return {
                    "id": repo["id"],
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "description": repo.get("description"),
                    "html_url": repo["html_url"],
                    "clone_url": repo["clone_url"],
                    "default_branch": repo.get("default_branch", "main"),
                    "language": repo.get("language"),
                    "private": repo["private"],
                    "fork": repo["fork"],
                    "created_at": repo["created_at"],
                    "updated_at": repo["updated_at"],
                    "size": repo.get("size", 0),
                    "stargazers_count": repo.get("stargazers_count", 0),
                    "forks_count": repo.get("forks_count", 0),
                    "open_issues_count": repo.get("open_issues_count", 0),
                }
            else:
                logger.error(f"Failed to fetch repository info: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching repository info: {e}")
            return None

    def validate_token(self, access_token: str) -> bool:
        """Validate if the GitHub token is still valid"""
        try:
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SecureThread-App/1.0"
            }
            
            response = requests.get(
                "https://api.github.com/user",
                headers=headers,
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return False

    def get_rate_limit_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get current rate limit information"""
        try:
            headers = {
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "SecureThread-App/1.0"
            }
            
            response = requests.get(
                "https://api.github.com/rate_limit",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            logger.error(f"Error fetching rate limit info: {e}")
            return None

    @staticmethod
    def get_authorization_url() -> str:
        """Get GitHub OAuth authorization URL"""
        return (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.GITHUB_CLIENT_ID}"
            f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
            f"&scope=repo,user:email"
            f"&state=random_state_string"  # Add CSRF protection
        )
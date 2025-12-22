import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Editor from '@monaco-editor/react';
import {
  ArrowLeft,
  Code,
  Sparkles,
  Save,
  AlertCircle,
} from 'lucide-react';

interface Vulnerability {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  line_number: number;
  recommendation: string;
  fix_suggestion?: string;
}

const FileEditor: React.FC = () => {
  const { repositoryId } = useParams<{ repositoryId: string }>();
  const location = useLocation();

// Extract file path from URL (everything after /files/)
  const filePath = location.pathname.split('/files/')[1]?.replace('/edit', '') || '';
  const decodedFilePath = decodeURIComponent(filePath);
  const navigate = useNavigate();
  
  const [fileContent, setFileContent] = useState('');
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('javascript');
  const [decorations, setDecorations] = useState<any[]>([]);

  useEffect(() => {
    fetchFileData();
  }, [repositoryId, filePath]);

  const fetchFileData = async () => {
  try {
    const token = localStorage.getItem('access_token');
    
    console.log('Fetching file:', filePath);
    console.log('Repository ID:', repositoryId);
    
    // Fetch file content
    const fileResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/repositories/${repositoryId}/file?file_path=${encodeURIComponent(filePath)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }
    
    const fileData = await fileResponse.json();
    console.log('File data received:', fileData);
    
    // ✅ Handle different response formats
    let content = '';
    
    if (typeof fileData === 'string') {
      // Direct string content
      content = fileData;
    } else if (fileData.content) {
      if (typeof fileData.content === 'string') {
        // Check if it's base64
        if (fileData.encoding === 'base64' || fileData.content.match(/^[A-Za-z0-9+/=]+$/)) {
          try {
            content = atob(fileData.content.replace(/\n/g, ''));
          } catch (e) {
            // Not base64, use as-is
            content = fileData.content;
          }
        } else {
          content = fileData.content;
        }
      } else if (typeof fileData.content === 'object' && fileData.content.content) {
        // Nested structure from GitHub API
        try {
          content = atob(fileData.content.content.replace(/\n/g, ''));
        } catch (e) {
          content = fileData.content.content;
        }
      }
    } else {
      content = '// No content available';
    }
    
    console.log('Decoded content length:', content.length);
    setFileContent(content);
    
    // Detect language
    const ext = filePath.split('.').pop()?.toLowerCase() || 'javascript';
    setLanguage(getLanguageFromExtension(ext));
    
    // Fetch vulnerabilities for this file
    const vulnResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/repositories/${repositoryId}/vulnerabilities?file_path=${encodeURIComponent(filePath)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (vulnResponse.ok) {
      const vulnData = await vulnResponse.json();
      console.log('Vulnerabilities:', vulnData);
      setVulnerabilities(Array.isArray(vulnData) ? vulnData : []);
    } else {
      console.warn('Failed to fetch vulnerabilities');
      setVulnerabilities([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching file data:', error);
    setFileContent('// Error loading file content');
    setLoading(false);
  }
};

  const getLanguageFromExtension = (ext: string): string => {
    const map: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'cpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
    };
    return map[ext] || 'javascript';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'bg-red-500', text: 'text-red-600', hex: '#DC2626' };
      case 'high': return { bg: 'bg-orange-500', text: 'text-orange-600', hex: '#EA580C' };
      case 'medium': return { bg: 'bg-yellow-500', text: 'text-yellow-600', hex: '#CA8A04' };
      case 'low': return { bg: 'bg-blue-500', text: 'text-blue-600', hex: '#2563EB' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-600', hex: '#6B7280' };
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Add line decorations for vulnerabilities
    const newDecorations = vulnerabilities.map(vuln => ({
      range: new monaco.Range(vuln.line_number, 1, vuln.line_number, 1),
      options: {
        isWholeLine: true,
        className: `line-${vuln.severity}`,
        glyphMarginClassName: `glyph-${vuln.severity}`,
        glyphMarginHoverMessage: { value: `**${vuln.title}**\n\n${vuln.description}` },
        linesDecorationsClassName: `line-decoration-${vuln.severity}`,
      }
    }));
    
    editor.deltaDecorations([], newDecorations);
    setDecorations(newDecorations);
  };

  const handleGetAISuggestion = async () => {
    setAiSidebarOpen(true);
    setAiSuggestion('Loading AI suggestion...');
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/repositories/ai/fix-file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_path: filePath,
            content: fileContent,
            vulnerabilities: vulnerabilities.map(v => ({
              line: v.line_number,
              title: v.title,
              severity: v.severity,
            }))
          })
        }
      );
      
      const data = await response.json();
      setAiSuggestion(data.fixed_content || 'No suggestion available');
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setAiSuggestion('Failed to get AI suggestion. Please try again.');
    }
  };

  const handleApplyAI = () => {
    setFileContent(aiSuggestion);
    setAiSidebarOpen(false);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/repositories/${repositoryId}/create-pr`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_path: filePath,
            new_content: fileContent,
            vulnerability_ids: vulnerabilities.map(v => v.id),
          })
        }
      );
      
      const data = await response.json();
      if (data.pr_url) {
        alert(`Pull request created: ${data.pr_url}`);
        window.open(data.pr_url, '_blank');
        navigate(`/projects/${repositoryId}`);
      }
    } catch (error) {
      console.error('Error creating PR:', error);
      alert('Failed to create pull request');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1E1E1E]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1E1E1E]">
      {/* Custom CSS for line highlighting */}
      <style>{`
        .line-critical { background-color: rgba(220, 38, 38, 0.15) !important; }
        .line-high { background-color: rgba(234, 88, 12, 0.15) !important; }
        .line-medium { background-color: rgba(202, 138, 4, 0.15) !important; }
        .line-low { background-color: rgba(37, 99, 235, 0.15) !important; }
        
        .glyph-critical::before { content: "●"; color: #DC2626; font-size: 16px; }
        .glyph-high::before { content: "●"; color: #EA580C; font-size: 16px; }
        .glyph-medium::before { content: "●"; color: #CA8A04; font-size: 16px; }
        .glyph-low::before { content: "●"; color: #2563EB; font-size: 16px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#252526] border-b border-[#3E3E42]">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${repositoryId}`)}
            className="text-white hover:bg-[#3E3E42]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {filePath?.split('/').pop()}
            </h1>
            <p className="text-sm text-gray-400">{filePath}</p>
          </div>
          <Badge className="bg-red-500 text-white">
            {vulnerabilities.length} vulnerabilities
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Code className="w-4 h-4 mr-2" />
              Fix Vulnerabilities
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleGetAISuggestion}
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestion
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save & Create PR
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`flex-1 ${aiSidebarOpen ? 'mr-[500px]' : ''} transition-all duration-300`}>
          <Editor
            height="100%"
            language={language}
            value={fileContent}
            onChange={(value) => setFileContent(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              readOnly: !isEditing,
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              glyphMargin: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Vulnerabilities Sidebar (Right) */}
        <div className="w-80 bg-[#252526] border-l border-[#3E3E42] overflow-y-auto">
          <div className="p-4 border-b border-[#3E3E42]">
            <h3 className="text-white font-semibold flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Vulnerabilities ({vulnerabilities.length})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {vulnerabilities.map((vuln) => {
              const colors = getSeverityColor(vuln.severity);
              return (
                <div
                  key={vuln.id}
                  className="p-3 bg-[#2D2D30] rounded-lg border border-[#3E3E42] hover:border-[#007ACC] cursor-pointer transition-colors"
                  onClick={() => {
                    // Scroll to line in editor
                    // Monaco editor integration needed here
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`${colors.bg} text-white text-xs`}>
                      {vuln.severity}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Line {vuln.line_number}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {vuln.title}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    {vuln.description}
                  </p>
                  <p className="text-xs text-blue-400">
                    <strong>Fix:</strong> {vuln.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Suggestion Sidebar (Overlay from right) */}
        {aiSidebarOpen && (
          <div className="fixed right-0 top-0 h-full w-[500px] bg-[#1E1E1E] border-l border-[#3E3E42] shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-[#3E3E42] flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                AI Fix Suggestion
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <Editor
                height="100%"
                language={language}
                value={aiSuggestion}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                }}
              />
            </div>

            <div className="p-4 border-t border-[#3E3E42] flex space-x-2">
              <Button
                onClick={handleApplyAI}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Apply Suggestion
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiSidebarOpen(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileEditor;
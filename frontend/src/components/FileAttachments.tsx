import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, File, FileText, Image, Archive, Eye, Link, ExternalLink } from 'lucide-react';
import { useFrappePostCall, useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FileAttachment {
  name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  is_private: number;
  attached_to_doctype: string;
  attached_to_name: string;
  creation: string;
  owner: string;
  modified: string;
}

interface FileAttachmentsProps {
  doctype: string;
  docname: string;
  title?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  className?: string;
}

export function FileAttachments({
  doctype,
  docname,
  title = "File Attachments",
  allowUpload = true,
  allowDelete = true,
  className = ""
}: FileAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [isAttachingLink, setIsAttachingLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useFrappeAuth();
  
  // Fetch file attachments
  const { data: attachments, mutate: refreshAttachments, isLoading } = useFrappeGetDocList<FileAttachment>('File', {
    fields: ['name', 'file_name', 'file_url', 'file_size', 'is_private', 'attached_to_doctype', 'attached_to_name', 'creation', 'owner', 'modified'],
    filters: [
      ['attached_to_doctype', '=', doctype],
      ['attached_to_name', '=', docname]
    ],
    orderBy: { field: 'creation', order: 'desc' },
    limit: 0
  });

  const { call: deleteFile } = useFrappePostCall('frappe.client.delete');

  // Get file icon based on file extension or type
  const getFileIcon = (file: FileAttachment) => {
    // Check if it's a link attachment
    if (isLinkAttachment(file)) {
      return <Link className="h-6 w-6 text-blue-500" />;
    }
    
    const extension = file.file_name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-6 w-6 text-purple-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-6 w-6 text-gray-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    // Check file sizes before upload
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      // Use setTimeout to avoid immediate conflict with any system notifications
      setTimeout(() => {
        toast.error(`File(s) too large: ${fileNames}. Maximum size is 25MB per file.`);
      }, 100);
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        
        formData.append('file', file);
        formData.append('doctype', doctype);
        formData.append('docname', docname);
        formData.append('is_private', '0');

        try {
          // Use fetch directly for file upload as frappe-react-sdk might not handle FormData correctly
          const response = await fetch('/api/method/upload_file', {
            method: 'POST',
            body: formData,
            credentials: 'include', // Important for session authentication
          });

          if (!response.ok) {
            const errorText = await response.text();
            // Check if it's a size limit error
            if (errorText.includes('too large') || errorText.includes('size') || response.status === 413) {
              throw new Error(`File "${file.name}" is too large. Maximum size is 25MB.`);
            }
            throw new Error(`Upload failed for "${file.name}": ${response.statusText}`);
          }
          
          // Try to parse response JSON, but don't fail if it's not JSON
          let responseData;
          try {
            responseData = await response.json();
          } catch (jsonError) {
            // Response might not be JSON, that's okay for file upload
            console.log('Response is not JSON, assuming success');
          }
          
          // Check for errors in response if we have JSON data
          if (responseData?.message?.error) {
            throw new Error(`Upload failed for "${file.name}": ${responseData.message.error}`);
          }
          
          successCount++;
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
          
          // Only show specific error messages for client-side validation
          // Don't show server errors to avoid duplicates with ERPNext notifications
          if (errorMessage.includes('too large') || errorMessage.includes('25MB')) {
            // Only show if it's a client-side size check, not server response
            if (file.size > MAX_FILE_SIZE) {
              setTimeout(() => {
                toast.error(errorMessage);
              }, 100);
            }
          }
          errorCount++;
        }
      }
      
      // Refresh attachments list only once with a small delay
      setTimeout(async () => {
        await refreshAttachments();
        
        // // Show success notification for uploaded files
        // if (successCount > 0 && errorCount === 0) {
        //   toast.success(`${successCount} file(s) uploaded successfully`);
        // } else if (successCount > 0 && errorCount > 0) {
        //   toast.warning(`${successCount} file(s) uploaded successfully, ${errorCount} failed`);
        // } else if (errorCount > 0 && successCount === 0) {
        //   // Don't show general error if specific errors were already shown
        //   const hasSpecificErrors = Array.from(files).some(file => file.size > MAX_FILE_SIZE);
        //   if (!hasSpecificErrors) {
        //     toast.error(`Failed to upload ${errorCount} file(s)`);
        //   }
        // }
      }, 500); // Reduced delay
      
    } catch (error) {
    //   console.error('Error uploading files:', error);
      // Don't show generic error toast to avoid duplicate with ERPNext
      // toast.error('Failed to upload file(s)');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file delete
  const handleFileDelete = async (file: FileAttachment) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    try {
      await deleteFile({
        doctype: 'File',
        name: file.name
      });
      
      // Refresh the attachments list after deletion
      await refreshAttachments();
      
      // Don't show toast notification to avoid duplicate with ERPNext notification
      // ERPNext automatically shows a success notification when file is deleted
      
    } catch (error) {
      console.error('Error deleting file:', error);
      // Only show error toast if deletion fails
      toast.error('Failed to delete file');
    }
  };

  // Handle link attachment
  const handleAttachLink = async () => {
    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsAttachingLink(true);
    
    try {
      // Create a File record for the link
      const response = await fetch('/api/method/frappe.client.insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doc: {
            doctype: 'File',
            file_name: linkTitle.trim() || linkUrl,
            file_url: linkUrl,
            attached_to_doctype: doctype,
            attached_to_name: docname,
            is_private: 0
          }
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to attach link');
      }

      // Reset form and close dialog
      setLinkUrl('');
      setLinkTitle('');
      setShowLinkDialog(false);
      
      // Refresh attachments
      await refreshAttachments();
      toast.success('Link attached successfully');
      
    } catch (error) {
      console.error('Error attaching link:', error);
      toast.error('Failed to attach link');
    } finally {
      setIsAttachingLink(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    // Clear the input after handling to allow re-selecting the same file
    e.target.value = '';
  };

  // Handle file preview
  const handlePreview = (file: FileAttachment) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  // Check if file is image
  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  };

  // Check if attachment is a link
  const isLinkAttachment = (file: FileAttachment) => {
    // Debug: log file data to understand the structure
    console.log('Checking file:', {
      file_name: file.file_name,
      file_url: file.file_url,
      file_size: file.file_size
    });
    
    // Check if file_url is an external URL and one of these conditions:
    // 1. file_size is 0 (typical for link attachments)
    // 2. file_name is also a URL
    // 3. file doesn't have a file extension (indicating it's likely a link with custom title)
    const isExternalUrl = file.file_url.startsWith('http://') || file.file_url.startsWith('https://');
    const hasNoSize = file.file_size === 0;
    const fileNameIsUrl = file.file_name.startsWith('http://') || file.file_name.startsWith('https://');
    const hasNoExtension = !file.file_name.includes('.') || file.file_name.split('.').length < 2;
    
    const result = isExternalUrl && (hasNoSize || fileNameIsUrl || hasNoExtension);
    console.log('isLinkAttachment result:', result, {
      isExternalUrl,
      hasNoSize,
      fileNameIsUrl,
      hasNoExtension
    });
    
    return result;
  };

  // Check if user can delete file
  const canDeleteFile = (file: FileAttachment) => {
    return allowDelete && (file.owner === currentUser || currentUser === 'Administrator');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <File className="h-5 w-5" />
          {title}
          {attachments && (
            <span className="inline-flex px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {attachments.length}
            </span>
          )}
        </h3>

        {allowUpload && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLinkDialog(true)}
              disabled={isUploading || isAttachingLink}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Link className="h-4 w-4 mr-1" />
              Attach Link
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileInputChange}
              className="hidden"
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading attachments...</span>
        </div>
      )}

      {/* File List */}
      {!isLoading && (
        <>
          {attachments && attachments.length > 0 ? (
            <div className="space-y-3">
              {attachments.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file_name}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded by {file.owner}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.creation).toLocaleDateString()}
                      </p>
                      {file.is_private === 1 && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isImageFile(file.file_name) && !isLinkAttachment(file) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(file)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.file_url, '_blank')}
                      className="text-xs"
                    >
                      {isLinkAttachment(file) ? (
                        <>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Link
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </>
                      )}
                    </Button>

                    {canDeleteFile(file) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileDelete(file)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No files attached</p>
              <p className="text-gray-500 text-sm mt-2">
                {allowUpload 
                  ? "Upload files to attach them to this project" 
                  : "No files have been attached to this project"
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Attach Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Attach Link
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="link-url" className="text-sm font-medium">
                URL *
              </Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="link-title" className="text-sm font-medium">
                Title (optional)
              </Label>
              <Input
                id="link-title"
                type="text"
                placeholder="Enter a descriptive title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAttachLink}
                disabled={!linkUrl.trim() || isAttachingLink}
                className="flex-1"
              >
                {isAttachingLink ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Attaching...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Attach Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkTitle('');
                }}
                disabled={isAttachingLink}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{previewFile.file_name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex items-center justify-center p-4">
              {isImageFile(previewFile.file_name) ? (
                <img
                  src={previewFile.file_url}
                  alt={previewFile.file_name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <div className="text-center">
                  <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <Button
                    className="mt-4"
                    onClick={() => window.open(previewFile.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

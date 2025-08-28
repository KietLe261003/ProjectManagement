import React, { useState, useRef } from 'react';
import { Upload, Download, Trash2, File, FileText, Image, Archive, Eye } from 'lucide-react';
import { useFrappePostCall, useFrappeGetDocList, useFrappeAuth } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
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

  // Get file icon based on file extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
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

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (allowUpload) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if we're leaving the actual drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!allowUpload) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files);
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

      {/* Drag and Drop Area */}
      {allowUpload && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-colors cursor-pointer ${
            isUploading
              ? 'border-green-500 bg-green-50'
              : isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <div className="text-center pointer-events-none">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Uploading files...
                </p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-blue-600">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Any file type, up to 25MB per file
                </p>
              </>
            )}
          </div>
        </div>
      )}

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
                    {getFileIcon(file.file_name)}
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
                    {isImageFile(file.file_name) && (
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
                      <Download className="h-3 w-3 mr-1" />
                      Download
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

import FileUpload from '../FileUpload';

export default function FileUploadExample() {
  return (
    <FileUpload
      onFileSelect={(file) => console.log('File selected:', file.name)}
      isLoading={false}
    />
  );
}

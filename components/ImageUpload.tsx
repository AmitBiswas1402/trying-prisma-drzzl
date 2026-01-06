import { XIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

const ImageUpload = ({ endpoint, onChange, value }: ImageUploadProps) => {
    if (value) {
    return (
    <div className="relative size-40">
      <Image
        src={value}
        alt="Upload"
        width={160}
        height={160}
        className="rounded-md size-40 object-cover"
      />
      <button
        onClick={() => onChange("")}
        className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
        type="button"
      >
        <XIcon className="h-4 w-4 text-white" />
      </button>
    </div>
    );
  }

  return (
    <div>ImageUpload</div>
  )
}
export default ImageUpload
"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilenameModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (filename: string) => void;
}

const FilenameModal = ({ open, onClose, onSave }: FilenameModalProps) => {
  const [filename, setFilename] = useState("");

  const handleSave = () => {
    if (filename.trim() === "") return;
    onSave(filename);
    setFilename("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Name your document</DialogTitle>
          <DialogDescription>
            Enter a name for your transcription document
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Document name</Label>
            <Input
              id="filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter document name"
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-start gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={filename.trim() === ""}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilenameModal;

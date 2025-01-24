import { ReactNode } from "react";
import { X, Trash } from "react-feather";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children?: ReactNode;
}

const Modal = ({ open, onClose, children }: ModalProps) => {
    if (!open) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 flex justify-center items-center transition-colors visible bg-black/20"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow p-6 transition-all scale-100 opacity-100"
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 rounded-lg text-gray-400 bg-white hover:bg-gray-50 hover:text-gray-600"
                >
                    <X />
                </button>
                {children ? (
                    children
                ) : (
                    <div className="text-center w-56">
                        <Trash size={56} className="mx-auto text-red-500" />
                        <div className="mx-auto my-4 w-48">
                            <h3 className="text-lg font-black text-gray-800">Confirm Delete</h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete this item?
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="btn btn-danger w-full">Delete</button>
                            <button className="btn btn-light w-full" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;

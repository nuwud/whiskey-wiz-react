import { useToast } from '../../hooks/use-toast.hook';

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${
            toast.type === 'error'
              ? 'bg-red-50 border-red-400'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-400'
              : toast.type === 'success'
              ? 'bg-green-50 border-green-400'
              : 'bg-white border-gray-200'
          } border rounded-lg shadow-lg p-4 max-w-md transition-all duration-300`}
        >
          {toast.title && (
            <div className="font-semibold mb-1">
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="text-sm text-gray-600">
              {toast.description}
            </div>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
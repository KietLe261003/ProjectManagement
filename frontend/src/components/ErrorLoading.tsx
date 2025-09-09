interface ErrorLoadingProps {
  error: Error | null;
}
const ErrorLoading = ({ error }: ErrorLoadingProps) => {
    return (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading tasks
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {error.message ||
                      "Failed to load your tasks. Please try again."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
};

export default ErrorLoading;
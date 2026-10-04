
interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  height?: string;
}

export default function TableSkeleton({ rows = 5, cols = 5, height = 'h-4' }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-gray-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-3 px-3">
              <div
                className={`${height} bg-gray-200/80 rounded ${
                  cIdx === 0 ? 'w-24' : cIdx === cols - 1 ? 'w-16 ml-auto' : 'w-full max-w-[120px]'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface InventoryChartProps {
  data?: any
}

export default function InventoryChart({ data }: InventoryChartProps) {
  return (
    <div className="h-64 flex items-center justify-center text-gray-500">
      <p>Inventory chart visualization will appear here</p>
    </div>
  )
}
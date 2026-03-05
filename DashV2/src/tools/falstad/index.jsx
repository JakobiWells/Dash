export default function Falstad() {
  return (
    <div className="h-full rounded-xl overflow-hidden">
      <iframe
        src="https://www.falstad.com/circuit/circuitjs.html"
        className="w-full h-full border-0"
        title="Falstad Circuit Simulator"
        allowFullScreen
      />
    </div>
  )
}

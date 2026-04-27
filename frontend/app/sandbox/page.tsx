import { ShipmentStepper } from './components/ShipmentStepper';
import type { ShipmentStep } from './components/ShipmentStepper';

const DEMOS: {
  title: string;
  shipmentId: string;
  origin: string;
  destination: string;
  currentStatus: ShipmentStep;
  timestamps: { [key in ShipmentStep]?: string | null };
}[] = [
  {
    title: 'Just Created',
    shipmentId: 'FF-00123',
    origin: 'Lagos, NG',
    destination: 'Abuja, NG',
    currentStatus: 'created',
    timestamps: {
      created: 'Apr 27, 2026 09:00 AM',
    },
  },
  {
    title: 'Picked Up',
    shipmentId: 'FF-00124',
    origin: 'Kano, NG',
    destination: 'Port Harcourt, NG',
    currentStatus: 'picked_up',
    timestamps: {
      created: 'Apr 27, 2026 09:00 AM',
      carrier_assigned: 'Apr 27, 2026 10:15 AM',
      picked_up: 'Apr 27, 2026 01:30 PM',
    },
  },
  {
    title: 'In Transit',
    shipmentId: 'FF-00125',
    origin: 'Ibadan, NG',
    destination: 'Enugu, NG',
    currentStatus: 'in_transit',
    timestamps: {
      created: 'Apr 26, 2026 08:00 AM',
      carrier_assigned: 'Apr 26, 2026 09:45 AM',
      picked_up: 'Apr 26, 2026 02:00 PM',
      in_transit: 'Apr 27, 2026 06:00 AM',
    },
  },
  {
    title: 'Out for Delivery',
    shipmentId: 'FF-00126',
    origin: 'Kaduna, NG',
    destination: 'Benin City, NG',
    currentStatus: 'out_for_delivery',
    timestamps: {
      created: 'Apr 24, 2026 10:00 AM',
      carrier_assigned: 'Apr 24, 2026 11:30 AM',
      picked_up: 'Apr 24, 2026 03:00 PM',
      in_transit: 'Apr 25, 2026 07:00 AM',
      at_destination_hub: 'Apr 26, 2026 11:00 PM',
      out_for_delivery: 'Apr 27, 2026 08:30 AM',
    },
  },
  {
    title: 'Delivered',
    shipmentId: 'FF-00127',
    origin: 'Aba, NG',
    destination: 'Jos, NG',
    currentStatus: 'delivered',
    timestamps: {
      created: 'Apr 22, 2026 09:00 AM',
      carrier_assigned: 'Apr 22, 2026 10:00 AM',
      picked_up: 'Apr 22, 2026 02:30 PM',
      in_transit: 'Apr 23, 2026 06:00 AM',
      at_destination_hub: 'Apr 24, 2026 09:00 PM',
      out_for_delivery: 'Apr 25, 2026 07:45 AM',
      delivered: 'Apr 25, 2026 01:15 PM',
    },
  },
];

export default function ShipmentStepperDemoPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Shipment Timeline</h1>
        <p className="mb-10 text-sm text-gray-500">
          ShipmentStepper component — five lifecycle states
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((demo) => (
            <div key={demo.shipmentId} className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* card header */}
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {demo.title}
                  </span>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                    {demo.shipmentId}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{demo.origin}</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-medium text-gray-700">{demo.destination}</span>
                </div>
              </div>

              {/* stepper */}
              <div className="px-5 py-5">
                <ShipmentStepper
                  currentStatus={demo.currentStatus}
                  timestamps={demo.timestamps}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

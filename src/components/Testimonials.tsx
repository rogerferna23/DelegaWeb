import { Star } from 'lucide-react';

interface Review { text: string; name: string; role: string; initials: string }

const reviews: Review[] = [
  {
    text: '"Gracias a DelegaWeb, nuestra web genera el triple de leads que antes. El equipo es profesional y rápido."',
    name: "Laura Martínez",
    role: "CEO de FitVida",
    initials: "LM",
  },
  {
    text: '"Montaron nuestra tienda online en tiempo récord. Las ventas han crecido un 200% en 3 meses."',
    name: "Carlos Rodríguez",
    role: "Fundador de TechStore",
    initials: "CR",
  },
  {
    text: '"Las campañas de Google Ads que gestionan nos traen pacientes cada día. Totalmente recomendados."',
    name: "Ana García",
    role: "Directora de Marketing, ClínicaSalud",
    initials: "AG",
  },
];

const Testimonials = () => (
  <section id="testimonios" className="w-full py-16 max-w-6xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold">Lo que dicen nuestros <span className="text-primary">clientes</span></h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((review, index) => (
        <div key={index} className="bg-cardbg border border-gray-800/60 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex gap-1 text-primary">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
          </div>

          <p className="text-gray-300 text-xs flex-grow">
            {review.text}
          </p>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-gray-700/50">
              {review.initials}
            </div>
            <div>
              <p className="font-bold text-xs">{review.name}</p>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider">{review.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Testimonials;

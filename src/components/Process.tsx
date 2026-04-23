interface Step { num: string; title: string; description: string }

const steps: Step[] = [
  { num: '01', title: 'Analizamos tu negocio',         description: 'Entendemos tus objetivos, tu público y tu competencia.' },
  { num: '02', title: 'Diseñamos tu estrategia',        description: 'Creamos un plan digital a medida para tu marca.' },
  { num: '03', title: 'Creamos tu web o campaña',       description: 'Desarrollamos con las mejores tecnologías del mercado.' },
  { num: '04', title: 'Optimizamos para resultados',    description: 'Medimos, ajustamos y mejoramos continuamente.' },
  { num: '05', title: 'Escalamos tu crecimiento',       description: 'Ampliamos tu presencia digital según tus resultados.' },
];

const Process = () => (
  <section id="proceso" className="w-full py-16 max-w-4xl mx-auto">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestro <span className="text-primary">proceso</span></h2>
      <p className="text-gray-400 text-sm">Un proceso claro y transparente para garantizar resultados.</p>
    </div>
    <div className="relative">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800/80 -translate-x-1/2 md:block hidden" />
      <div className="flex flex-col gap-12">
        {steps.map((step, index) => (
          <div key={step.num} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
            <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary hidden md:block" />
            <div className={`w-full md:w-[45%] flex ${index % 2 === 0 ? 'justify-end md:pr-12' : 'justify-start md:pl-12'}`}>
              <div className="bg-cardbg border border-gray-800/60 rounded-xl p-6 hover:border-gray-700 transition-colors w-full text-center md:text-right">
                <div className={`text-primary font-bold mb-2 text-sm ${index % 2 !== 0 ? 'md:text-left' : ''}`}>{step.num}</div>
                <h3 className={`text-lg font-bold mb-2 ${index % 2 !== 0 ? 'md:text-left' : ''}`}>{step.title}</h3>
                <p className={`text-gray-400 text-xs leading-relaxed ${index % 2 !== 0 ? 'md:text-left' : ''}`}>{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Process;

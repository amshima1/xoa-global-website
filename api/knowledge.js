const pages = [
  {
    title: "Home",
    content: `XOA Solutions Limited is an engineering and energy company focused on practical solutions for a changing world. The company says it was founded in 2007 and works across energy and engineering, bringing research, technical thinking and a commitment to quality into the conversation. Its stated focus includes engineering, energy, innovation, renewable energy and power challenges. The homepage says XOA is committed to supporting sustainable development through its areas of work.`
  },
  {
    title: "About",
    content: `XOA Solutions Limited is an engineering and energy company founded in 2007. It works across renewable energy, power and engineering, with a commitment to innovation, quality and sustainable development. Its vision is a sustainable future shaped by purposeful engineering and responsible innovation. Its mission is to pursue thoughtful energy and engineering solutions, grounded in quality and guided by sustainable development. Published company values are innovation, quality, sustainability and integrity. The company describes itself as international-minded. Do not infer a location, certification, client, award or achievement.`
  },
  {
    title: "Services",
    content: `The published areas of work are: solar and photovoltaic energy; renewable energy solutions; power solutions; engineering solutions; research and development; and quality assurance and standardisation. The solar and photovoltaic description says this work focuses on solutions that respond to changing energy needs, without giving specifications or performance results. Renewable energy is described as considering cleaner energy sources and responsible development. Power solutions are discussed from an engineering-led perspective in response to evolving power requirements. Engineering work is described in terms of practical problem-solving, thoughtful design and quality in execution. Research and development values investigation, learning and innovation. Quality assurance and standardisation recognise careful processes and consistent approaches to quality. The site does not provide detailed project scopes, guarantees, pricing or technical specifications.`
  },
  {
    title: "Projects",
    content: `Published XOA project information includes three examples. Solar street lighting installations (Public Infrastructure): From community roads to public facilities, XOA has supplied and installed street-lighting systems across Abuja, Kano, Kaduna, Borno, Cross River, Lagos and other states. Transformer and grid works (Community Infrastructure): Transformer and rural electrification work help strengthen local infrastructure. This site photo is geotagged to Ikot Osom, Akwa Ibom. Solar systems and mini-grids (Power & Electrification): A 50 kVA solar mini-grid in Gubio, Borno State, is one example of XOA’s work alongside solar power systems for homes and institutions. No project dates, client names, technical specifications, guarantees or performance statistics are published. Project-specific photographs are not currently supplied on the website.`
  },
  {
    title: "Contact",
    content: `The published Contact page welcomes conversations about energy and engineering. Email, telephone and WhatsApp details are marked as awaiting confirmation; no actual contact details are published. The enquiry form is a frontend preview and needs backend integration before it can submit or deliver enquiries. Do not invent contact details or claim that a message has been sent.`
  }
];

module.exports = pages.map(({ title, content }) => `## ${title}\n${content}`).join("\n\n");
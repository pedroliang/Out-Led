// OUT LED — Main React App
const { useState, useEffect, useRef, useMemo } = React;
const Icon = window.OUTLED_Icon;
const UI = window.OUTLED_UI;
const PRODUCTS = window.OUTLED_PRODUCTS;
const CATEGORIES = window.OUTLED_CATEGORIES;

// ---------- Reveal on scroll hook ----------
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

const Reveal = ({ children, stagger, as: As = "div", ...rest }) => {
  const ref = useReveal();
  return (
    <As ref={ref} className={(rest.className || "") + (stagger ? " reveal-stagger" : " reveal")} {...rest}>
      {children}
    </As>
  );
};

// ---------- Cursor halo ----------
function CursorHalo() {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    let tx = 0, ty = 0, x = 0, y = 0;
    const move = (e) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="cursor-halo" />;
}

// ---------- Marquee ----------
function Announce() {
  const items = [
    "Outlet de iluminação", "Até 50% off", "Frete grátis acima de R$ 299",
    "Garantia de 90 dias", "Produtos com pequenas avarias estéticas",
    "Funcionamento 100% testado", "Estoque limitado",
  ];
  // duplicate for infinite scroll
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className="announce">
      <div className="marquee">
        {all.map((t, i) => (
          <span key={i}><span className="dot"></span>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ cartCount, onCartOpen }) {
  return (
    <header className="header">
      <div className="wrap header-inner">
        <a href="#" className="logo">
          Out<span className="logo-dot"></span>Led
        </a>
        <nav className="nav">
          <a href="#produtos">Produtos</a>
          <a href="#categorias">Categorias</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre">Sobre</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="header-actions">
          <button className="icon-btn" aria-label="Buscar">{UI.search}</button>
          <button className="icon-btn" aria-label="Conta">{UI.user}</button>
          <button className="icon-btn" aria-label="Carrinho" onClick={onCartOpen}>
            {UI.cart}
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <Reveal as="div">
            <div className="eyebrow"><span className="live"></span> Outlet · estoque atualizado agora</div>
            <h1>
              Iluminação <span className="accent">de verdade</span>,<br />
              com preço de outlet.
            </h1>
            <p className="lead">
              Produtos LED novos com pequenas marcas estéticas, sem caixa ou
              embalagem reaproveitada. Mesma garantia, mesma qualidade —
              até <b style={{color: 'var(--led)'}}>50% mais barato</b>.
            </p>
            <div className="hero-cta">
              <a href="#produtos" className="btn btn-primary">Ver ofertas {UI.arrowRight}</a>
              <a href="#como-funciona" className="btn btn-ghost">Como funciona</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="num"><span className="pct">−42%</span></div>
                <div className="lbl">Economia média</div>
              </div>
              <div className="stat">
                <div className="num">90 dias</div>
                <div className="lbl">Garantia total</div>
              </div>
              <div className="stat">
                <div className="num">2.4k+</div>
                <div className="lbl">Pedidos enviados</div>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal as="div" className="hero-visual">
          <div className="lamp">
            <div className="lamp-glow"></div>
            <div className="lamp-bulb"></div>
          </div>
          <div className="hero-tag t1">
            <span className="dot"></span>
            <span>Projetor 1500W</span>
          </div>
          <div className="hero-tag t2">
            <span className="strike">R$ 390</span>
            <span className="new">R$ 249</span>
          </div>
          <div className="hero-tag t3">
            <span className="dot"></span>
            <span>3 em estoque</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- Strip ----------
function Strip() {
  const items = [
    { ico: UI.tag,       b: "Até 50% OFF",          s: "Em todo o catálogo outlet" },
    { ico: UI.shield,    b: "Garantia de 90 dias",  s: "Mesma do produto novo" },
    { ico: UI.truck,     b: "Frete grátis",         s: "Compras acima de R$ 299" },
    { ico: UI.card,      b: "Em até 12x",           s: "Sem juros no cartão" },
  ];
  return (
    <Reveal as="div" stagger className="wrap">
      <div className="strip">
        {items.map((it, i) => (
          <div className="strip-item" key={i}>
            <div className="strip-icon">{it.ico}</div>
            <div className="strip-text">
              <b>{it.b}</b>
              <span>{it.s}</span>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

// ---------- Como funciona ----------
function HowItWorks() {
  const steps = [
    { ico: UI.sparkle, n: "01 / Triagem", t: "Identificamos a marca",
      d: "Recebemos lotes de iluminação de fabricantes parceiros que não podem entrar na linha principal: pequeno arranhão, embalagem amassada, sem caixa." },
    { ico: UI.shield, n: "02 / Teste", t: "Testamos um por um",
      d: "Cada peça passa por inspeção elétrica e teste de funcionamento. Só vai pro estoque o que liga, ilumina e dura." },
    { ico: UI.lightning, n: "03 / Repasse", t: "Você paga menos, leva o mesmo",
      d: "Sem custo de embalagem premium e sem ficar parado no estoque do fabricante, o desconto vem direto pra você. De 30% a 50% off." },
  ];
  return (
    <section className="section how" id="como-funciona">
      <div className="wrap">
        <Reveal as="div" className="section-head">
          <div className="meta">
            <div className="section-tag">Modelo Out·Led</div>
            <h2>Outlet não é defeito. <em>É oportunidade.</em></h2>
          </div>
          <p>Cada produto que vendemos tem um motivo claro pra estar mais barato — e a gente conta exatamente qual.</p>
        </Reveal>
        <Reveal as="div" stagger className="how-grid">
          {steps.map((s, i) => (
            <div className="how-card" key={i}>
              <div className="how-icon">{s.ico}</div>
              <div className="how-num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ---------- Categorias ----------
function Categories({ onPick }) {
  const cats = CATEGORIES.map(c => ({
    ...c,
    count: PRODUCTS.filter(p => p.cat === c.id).length,
  }));
  return (
    <section className="section" id="categorias">
      <div className="wrap">
        <Reveal as="div" className="section-head">
          <div className="meta">
            <div className="section-tag">Catálogo</div>
            <h2>Encontre por <em>categoria</em>.</h2>
          </div>
          <p>De projetores industriais a fitas LED decorativas — todo tipo de iluminação com a marca Out·Led.</p>
        </Reveal>
        <Reveal as="div" stagger className="categories">
          {cats.map((c) => (
            <button key={c.id} className="cat" onClick={() => onPick(c.id)}>
              <div className="cat-icon"><Icon name={c.icon}/></div>
              <div className="cat-info">
                <h3 className="cat-name">{c.label}</h3>
                <div className="cat-count">{c.count} produtos</div>
              </div>
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ---------- Product card ----------
function ProductCard({ p, onAdd, onView }) {
  const discount = Math.round((1 - p.price / p.oldPrice) * 100);
  return (
    <article className="product">
      <div className="product-img">
        <div className="glow"></div>
        <Icon name={p.icon} color={p.color} />
        <div className="product-badges">
          <span className="badge badge-discount">−{discount}%</span>
          <span className="badge badge-condition">Outlet</span>
        </div>
        <button className="product-quick" onClick={() => onView(p)} aria-label="Visualizar">{UI.eye}</button>
      </div>
      <div className="product-body">
        <div className="product-cat">{p.catLabel}</div>
        <h3 className="product-title">{p.name}</h3>
        <div className="product-price-row">
          <div className="price-stack">
            <span className="price-old">R$ {p.oldPrice.toFixed(2).replace('.',',')}</span>
            <span className="price-now"><span className="currency">R$</span>{p.price.toFixed(2).replace('.',',')}</span>
          </div>
          <button className="add-btn" onClick={() => onAdd(p)} aria-label="Adicionar ao carrinho">{UI.plus}</button>
        </div>
      </div>
    </article>
  );
}

// ---------- Products section ----------
function Products({ filter, setFilter, onAdd, onView }) {
  const filtered = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  const filters = [{ id: "all", label: "Todos", count: PRODUCTS.length }, ...CATEGORIES.map(c => ({ id: c.id, label: c.label, count: PRODUCTS.filter(p => p.cat === c.id).length }))];

  return (
    <section className="section" id="produtos">
      <div className="wrap">
        <Reveal as="div" className="section-head">
          <div className="meta">
            <div className="section-tag">Em estoque agora</div>
            <h2>Ofertas <em>de verdade.</em></h2>
          </div>
          <p>Preços que mudam quando o estoque acaba. Sem ginástica de cupom — o desconto já tá aí.</p>
        </Reveal>

        <div className="filters">
          {filters.map(f => (
            <button
              key={f.id}
              className={"filter-btn" + (f.id === filter ? " active" : "")}
              onClick={() => setFilter(f.id)}
            >
              {f.label}<span className="count">({f.count})</span>
            </button>
          ))}
        </div>

        <Reveal as="div" stagger className="products" key={filter}>
          {filtered.map(p => (
            <ProductCard key={p.id} p={p} onAdd={onAdd} onView={onView} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ---------- Quick view modal ----------
function QuickView({ product, onClose, onAdd }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!product) return null;
  const p = product;
  const discount = Math.round((1 - p.price / p.oldPrice) * 100);

  return (
    <div className={"modal-backdrop" + (p ? " open" : "")} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>{UI.close}</button>
        <div className="modal-img">
          <Icon name={p.icon} color={p.color} />
        </div>
        <div className="modal-body">
          <div className="product-cat">{p.catLabel}</div>
          <h3>{p.name}</h3>
          <p className="modal-desc">{p.desc}</p>
          <div className="condition-box">
            <div className="lbl">Por que está em outlet</div>
            <div className="desc">{p.condition}</div>
          </div>
          <div className="modal-price">
            <span className="old">R$ {p.oldPrice.toFixed(2).replace('.',',')}</span>
            <span className="now">R$ {p.price.toFixed(2).replace('.',',')}</span>
            <span className="save">−{discount}%</span>
          </div>
          <button className="btn btn-primary" style={{ justifyContent: "center" }} onClick={() => { onAdd(p); onClose(); }}>
            Adicionar ao carrinho {UI.arrowRight}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Cart drawer ----------
function CartDrawer({ open, items, onClose, onInc, onDec, onRemove }) {
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const totalOld = items.reduce((s, it) => s + it.oldPrice * it.qty, 0);
  const saved = totalOld - total;

  return (
    <React.Fragment>
      <div className={"drawer-backdrop" + (open ? " open" : "")} onClick={onClose}/>
      <aside className={"drawer" + (open ? " open" : "")}>
        <div className="drawer-head">
          <h3>Seu carrinho ({items.length})</h3>
          <button className="icon-btn" onClick={onClose}>{UI.close}</button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="ico">{UI.cart}</div>
              <p>Seu carrinho está vazio.<br/>Que tal um projetor LED?</p>
            </div>
          ) : (
            items.map(it => (
              <div className="cart-line" key={it.id}>
                <div className="cart-line-img"><Icon name={it.icon} color={it.color}/></div>
                <div>
                  <div className="cart-line-name">{it.name}</div>
                  <div className="cart-line-price">R$ {it.price.toFixed(2).replace('.',',')}</div>
                  <div className="qty">
                    <button onClick={() => onDec(it.id)}>−</button>
                    <span className="num">{it.qty}</span>
                    <button onClick={() => onInc(it.id)}>+</button>
                  </div>
                </div>
                <button className="cart-line-remove" onClick={() => onRemove(it.id)}>Remover</button>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <div>
                <div className="lbl">Total</div>
                {saved > 0 && <span className="saved">economizou R$ {saved.toFixed(2).replace('.',',')}</span>}
              </div>
              <div className="amt">R$ {total.toFixed(2).replace('.',',')}</div>
            </div>
            <button className="checkout-btn">Finalizar compra</button>
          </div>
        )}
      </aside>
    </React.Fragment>
  );
}

// ---------- FAQ ----------
function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    { q: "O produto é novo ou usado?", a: "Todos os produtos são novos. Eles entram no outlet por motivos como: pequenos arranhões na carcaça, embalagem amassada ou ausência de caixa original. O componente eletrônico é o mesmo da linha principal, lacrado e nunca usado." },
    { q: "Tem garantia?", a: "Sim — 90 dias direto com a Out·Led, cobrindo qualquer defeito de funcionamento. Você pode trocar ou devolver dentro desse prazo. A garantia é a mesma do produto na linha cheia." },
    { q: "Como sei o que tem de errado em cada peça?", a: "A condição exata aparece em cada anúncio (em \"Por que está em outlet\"). A gente descreve o problema estético com sinceridade — sem surpresas na entrega." },
    { q: "Vocês emitem nota fiscal?", a: "Sim, todos os pedidos saem com NF-e. Importante pra quem é lojista, instalador ou precisa de comprovante." },
    { q: "E se eu sou lojista? Tem condição B2B?", a: "Sim. A partir de 10 unidades por pedido o desconto adicional aparece automaticamente no checkout. Acima de 50 unidades, fala com a gente direto pelo Instagram." },
    { q: "Quanto tempo leva pra chegar?", a: "São Paulo capital: 1 a 2 dias úteis. Demais regiões: 3 a 7 dias úteis. Despachamos em até 24h após confirmação do pagamento." },
  ];
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <Reveal as="div" className="faq-grid">
          <div>
            <div className="section-tag">Tira-dúvidas</div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4.5vw, 56px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
              margin: "0 0 16px",
              fontWeight: 600,
            }}>Perguntas <em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--led)" }}>frequentes.</em></h2>
            <p style={{ color: "var(--ink-300)", margin: 0 }}>O básico que todo cliente quer saber antes de comprar outlet.</p>
          </div>
          <div className="faq-list">
            {items.map((it, i) => (
              <div key={i} className={"faq-item" + (open === i ? " open" : "")} onClick={() => setOpen(open === i ? -1 : i)}>
                <div className="faq-q">
                  <span>{it.q}</span>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-a"><div style={{ paddingTop: 4 }}>{it.a}</div></div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- CTA Band ----------
function CTABand() {
  return (
    <section className="section" id="sobre">
      <div className="wrap">
        <Reveal as="div" className="cta-band">
          <div className="section-tag">Newsletter</div>
          <h2>Avisamos antes do <em>resto do mundo</em>.</h2>
          <p>O melhor da Out·Led acaba rápido. Cadastre seu e-mail e receba os novos lotes 24h antes de irem ao site público.</p>
          <form className="newsletter" onSubmit={(e) => { e.preventDefault(); }}>
            <input type="email" placeholder="seu@email.com" required/>
            <button type="submit">Cadastrar</button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col footer-about">
            <a href="#" className="logo">Out<span className="logo-dot"></span>Led</a>
            <p>Outlet de iluminação LED. Produtos novos, com pequenas marcas estéticas, até 50% mais baratos.</p>
          </div>
          <div className="footer-col">
            <h4>Loja</h4>
            <ul>
              <li><a href="#produtos">Todos os produtos</a></li>
              <li><a href="#categorias">Categorias</a></li>
              <li><a href="#">Mais vendidos</a></li>
              <li><a href="#">Novos lotes</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#sobre">Sobre nós</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#">Contato</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Suporte</h4>
            <ul>
              <li><a href="#">Política de troca</a></li>
              <li><a href="#">Garantia</a></li>
              <li><a href="#">Frete e prazo</a></li>
              <li><a href="#">B2B / Lojistas</a></li>
            </ul>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© 2026 Out·Led — Outlet de iluminação</span>
          <span>São Paulo · Brasil</span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Toast ----------
function Toast({ msg }) {
  return <div className={"toast" + (msg ? " show" : "")}>{UI.sparkle}{msg}</div>;
}

// ---------- App ----------
function App() {
  const [filter, setFilter] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (m) => {
    setToast(m);
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => setToast(""), 2200);
  };

  const add = (p) => {
    setCart(prev => {
      const found = prev.find(it => it.id === p.id);
      if (found) return prev.map(it => it.id === p.id ? { ...it, qty: it.qty + 1 } : it);
      return [...prev, { ...p, qty: 1 }];
    });
    showToast(`${p.name.split(" ").slice(0,3).join(" ")}... adicionado`);
  };
  const inc = (id) => setCart(prev => prev.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it));
  const dec = (id) => setCart(prev => prev.flatMap(it => it.id === id ? (it.qty > 1 ? [{ ...it, qty: it.qty - 1 }] : []) : [it]));
  const remove = (id) => setCart(prev => prev.filter(it => it.id !== id));

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  const pickCategory = (id) => {
    setFilter(id);
    setTimeout(() => {
      const el = document.getElementById("produtos");
      if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: "smooth" });
    }, 50);
  };

  return (
    <React.Fragment>
      <CursorHalo/>
      <Announce/>
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)}/>
      <main>
        <Hero/>
        <Strip/>
        <HowItWorks/>
        <Products filter={filter} setFilter={setFilter} onAdd={add} onView={setView}/>
        <Categories onPick={pickCategory}/>
        <FAQ/>
        <CTABand/>
      </main>
      <Footer/>
      <QuickView product={view} onClose={() => setView(null)} onAdd={add}/>
      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onInc={inc} onDec={dec} onRemove={remove}/>
      <Toast msg={toast}/>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

import Link from "next/link";

export function PandaProductStage() {
  return (
    <div className="panda-product-stage" aria-label="Продукт Red Panda Study: Compass AI, куратор и прозрачный маршрут">
      <div className="product-module product-module-compass">
        <span>Compass AI</span>
        <strong>82% fit</strong>
        <small>целевой сценарий</small>
      </div>
      <div className="product-module product-module-curator">
        <span className="module-avatar">А</span>
        <span><strong>Куратор рядом</strong><small>проверка сегодня</small></span>
        <i />
      </div>
      <div className="product-module product-module-route">
        <span>Маршрут 2027</span>
        <div><i /><i /><i /><i /></div>
        <small>7 из 12 этапов готовы</small>
      </div>

      <div className="product-orbit orbit-one" aria-hidden="true" />
      <div className="product-orbit orbit-two" aria-hidden="true" />
      <div className="product-orbit-dot orbit-dot-one" aria-hidden="true" />
      <div className="product-orbit-dot orbit-dot-two" aria-hidden="true" />

      <div className="product-panda" aria-hidden="true">
        <span className="panda-tail"><i /><i /></span>
        <span className="panda-body" />
        <span className="panda-head">
          <i className="panda-ear panda-ear-left" />
          <i className="panda-ear panda-ear-right" />
          <span className="panda-eye panda-eye-left"><b /></span>
          <span className="panda-eye panda-eye-right"><b /></span>
          <span className="panda-muzzle"><b /></span>
        </span>
        <span className="panda-laptop"><i>RPS</i></span>
      </div>

      <Link className="product-stage-link" href="/student">
        Продукт внутри <span>↗</span>
      </Link>
    </div>
  );
}

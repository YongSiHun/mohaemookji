import { BowlArt } from './BowlArt';

/** 메뉴 검색 소개 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        <p className="eyebrow">
          <span /> 매일의 메뉴 고민, 가볍게
        </p>
        <h1 id="hero-title">
          오늘 뭐해 먹지<span className="orange">?</span>
        </h1>
        <p className="hero-copy">
          먹고 싶은 맛과 가지고 있는 재료로
          <br className="desktop-break" /> 오늘의 메뉴를 찾아보세요.
        </p>
      </div>
      <BowlArt />
    </section>
  );
}

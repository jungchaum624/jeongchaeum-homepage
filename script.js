// 새로고침 시 항상 페이지 최상단에서 시작
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// 슬라이더 인터랙션 스크립트
document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("sliderTrack");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const dots = Array.from(document.querySelectorAll(".dot"));
  const barWrapper = document.getElementById("sliderBar");
  const barThumb = document.getElementById("sliderBarThumb");

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoSlideTimer = null;

  function updateSlider(index) {
    const prevIndex = currentIndex;
    currentIndex = (index + totalSlides) % totalSlides;

    // 인디케이터 바 위치 업데이트 (0%, 100%, 200%)
    if (barThumb) {
      barThumb.style.transform = `translateX(${currentIndex * 100}%)`;
    }

    // 도트 활성화 상태 업데이트 (호환용)
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentIndex);
    });

    // 직전 슬라이드를 밑에 깔아두고(prev), 현재 슬라이드를 위에 서서히 띄움(active)
    // -> 중간에 검은 화면 없이 같은 위치의 '정채움' 로고는 고정된 채 배경 사진만 자연스럽게 전환
    slides.forEach((slide, idx) => {
      slide.classList.remove("prev", "active");
      if (idx === currentIndex) {
        slide.classList.add("active");
      } else if (idx === prevIndex) {
        slide.classList.add("prev");
      }
    });
  }

  // 이전 / 다음 버튼 이벤트
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      resetAutoSlide();
      updateSlider(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      resetAutoSlide();
      updateSlider(currentIndex + 1);
    });
  }

  // 인디케이터 바 클릭 이벤트
  if (barWrapper) {
    barWrapper.addEventListener("click", (e) => {
      const trackElem = barWrapper.querySelector(".slider-bar-track") || barWrapper;
      const rect = trackElem.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const fraction = Math.max(0, Math.min(0.999, clickX / rect.width));
      const targetIndex = Math.floor(fraction * totalSlides);
      resetAutoSlide();
      updateSlider(targetIndex);
    });
  }

  // 인디케이터 도트 클릭 이벤트 (호환용)
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIndex = parseInt(dot.getAttribute("data-index"), 10);
      resetAutoSlide();
      updateSlider(targetIndex);
    });
  });

  // 자동 넘김 설정 (2.5초마다 부드럽게 넘김)
  function startAutoSlide() {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(() => {
      updateSlider(currentIndex + 1);
    }, 2500);
  }

  function resetAutoSlide() {
    startAutoSlide();
  }

  // 인트로 애니메이션(약 3.1초) 종료 후 히어로 슬라이더 자동 넘김 시작
  setTimeout(() => {
    startAutoSlide();
  }, 3100);

  // 키보드 좌우 방향키 탐색 지원
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      resetAutoSlide();
      updateSlider(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      resetAutoSlide();
      updateSlider(currentIndex + 1);
    }
  });

  // =========================================
  // =========================================
  // 최상단 및 섹션 이동 네비게이션 스크롤 제어
  // =========================================
  let isProgrammaticScrolling = false;
  let programmaticScrollTimer = null;

  function smoothScrollToTop() {
    isProgrammaticScrolling = true;
    if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    programmaticScrollTimer = setTimeout(() => {
      isProgrammaticScrolling = false;
      if (typeof updateNavAndProgress === "function") {
        updateNavAndProgress();
      }
    }, 800);
  }

  function smoothScrollToElement(targetEl) {
    if (!targetEl) return;

    if (targetEl.id === "historySection" && targetEl.offsetHeight === 0) {
      const altTimeline = document.getElementById("timelineScrollSection");
      if (altTimeline) targetEl = altTimeline;
    }

    isProgrammaticScrolling = true;
    if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);

    // 메뉴 이동 시 안전경영 카운트 락 등 중간 체류 락 즉시 완료 처리
    if (typeof finishIsoCounter === "function") {
      finishIsoCounter();
    }

    const topHeader = document.querySelector(".top-header");
    const headerHeight = topHeader ? topHeader.offsetHeight : 64;
    const elementRect = targetEl.getBoundingClientRect();
    const currentScrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
    const targetY = Math.max(0, Math.round(currentScrollY + elementRect.top - headerHeight + 2));

    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });

    programmaticScrollTimer = setTimeout(() => {
      isProgrammaticScrolling = false;
      if (typeof updateNavAndProgress === "function") {
        updateNavAndProgress();
      }
    }, 850);
  }

  // 사용자가 마우스 휠이나 터치로 개입하면 즉시 프로그래밍 스크롤 상태 해제
  window.addEventListener("wheel", () => {
    isProgrammaticScrolling = false;
    if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
  }, { passive: true });

  window.addEventListener("touchstart", () => {
    isProgrammaticScrolling = false;
    if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
  }, { passive: true });

  // 상단 헤더 메뉴 버튼 클릭 시 두 줄이 교차되어 X자로 전환 및 네비게이션 오버레이 토글
  const headerMenuBtn = document.querySelector(".header-menu-btn");
  const navOverlay = document.getElementById("navOverlay");
  const navLinks = document.querySelectorAll(".nav-link");

  function openMenu() {
    if (headerMenuBtn) headerMenuBtn.classList.add("active");
    if (navOverlay) {
      navOverlay.classList.add("active");
      navOverlay.setAttribute("aria-hidden", "false");
    }
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (headerMenuBtn) headerMenuBtn.classList.remove("active");
    if (navOverlay) {
      navOverlay.classList.remove("active");
      navOverlay.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
  }

  if (headerMenuBtn && navOverlay) {
    headerMenuBtn.addEventListener("click", () => {
      if (navOverlay.classList.contains("active")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // 소제목 링크 클릭 시 처리 (섹션 이동 또는 외부 링크 이동)
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("data-target");
        const href = link.getAttribute("href");
        if (targetId) {
          e.preventDefault();
          closeMenu();
          if (targetId === "heroSection") {
            setTimeout(() => {
              smoothScrollToTop();
            }, 60);
          } else {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              setTimeout(() => {
                smoothScrollToElement(targetEl);
              }, 60);
            }
          }
        } else if (href && href !== "#") {
          e.preventDefault();
          const target = link.getAttribute("target") || "_blank";
          window.open(href, target);
          closeMenu();
        }
      });
    });

    // 상단 바 로고 클릭 시 히어로 섹션(최상단)으로 부드럽고 매끄럽게 스크롤 및 메뉴 닫기
    const headerLogoLink = document.querySelector(".header-logo-link");
    if (headerLogoLink) {
      headerLogoLink.addEventListener("click", (e) => {
        e.preventDefault();
        const isMenuOpen = navOverlay && navOverlay.classList.contains("active");
        if (isMenuOpen) {
          closeMenu();
          setTimeout(() => {
            smoothScrollToTop();
          }, 60);
        } else {
          smoothScrollToTop();
        }
      });
    }

    // ESC 키로 메뉴 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navOverlay.classList.contains("active")) {
        closeMenu();
      }
    });
  }

  // =========================================
  // 안전경영 섹션: 숫자 카운트 및 스크롤 락 완전 해제 (정적 4 노출)
  // =========================================
  const safetyCounterEl = document.getElementById("safetyIsoCounter");
  if (safetyCounterEl) {
    safetyCounterEl.textContent = "4";
    safetyCounterEl.classList.add("finished");
  }

  function finishIsoCounter() {}

  // 스크롤 감지 Lazy Loading (공통 페이드인 애니메이션)
  const scrollElements = document.querySelectorAll(".scroll-fade, .scroll-slide-left, .scroll-slide-right");

  if (scrollElements.length > 0) {
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // 상장 카드의 경우 같은 가로 행(줄)에 속한 카드들이 하나하나가 아닌 동시에 다 똑같이 올라오도록 처리
            if (entry.target.classList.contains("award-card")) {
              const row = entry.target.closest(".awards-hero-row, .awards-grid-row");
              if (row) {
                row.querySelectorAll(".award-card").forEach((c) => c.classList.add("visible"));
              }
            }
            if (entry.target.classList.contains("safety-top-cards") || entry.target.closest("#safetySection")) {
              if (!isIsoCounting && !isIsoFinished) {
                startAutoIsoCounter();
              }
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
      }
    );
    scrollElements.forEach((el) => scrollObserver.observe(el));
  }

  // =========================================
  // 상단 바 전체 섹션 이름 네비게이션 & 상태표시줄(프로그레스 바) 동기화
  // 스크롤 중인 섹션만 검은 글씨(active), 상태표시줄도 현재 보고 있는 섹션 텍스트 위치에 정확히 일치
  // =========================================
  const progressBar = document.getElementById("scrollProgressBar");
  const headerNav = document.getElementById("headerNav");
  const headerNavLinks = document.querySelectorAll(".header-nav-link");

  if (headerNavLinks.length > 0) {
    const sectionNavMapping = [
      { id: "ceoSection", target: "ceoSection" },
      { id: "historySection", target: "historySection" },
      { id: "timelineScrollSection", target: "historySection" },
      { id: "visionSection", target: "visionSection" },
      { id: "boxMotionSection", target: "visionSection" },
      { id: "rdSection", target: "rdSection" },
      { id: "haccpTechSection", target: "haccpTechSection" },
      { id: "safetySection", target: "safetySection" },
      { id: "brandSection", target: "brandSection" },
      { id: "jeongchaeumSection", target: "brandSection" },
      { id: "hanwooSection", target: "brandSection" },
      { id: "partnersSection", target: "partnersSection" },
      { id: "salesSection", target: "salesSection" },
      { id: "trustSloganSection", target: "salesSection" }
    ];

    function updateNavAndProgress() {
      const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
      const topHeader = document.querySelector(".top-header");
      const headerHeight = topHeader ? topHeader.offsetHeight : 70;
      const scanLine = headerHeight + 90; // 헤더 바로 아래 감지선

      let activeTarget = null;

      const ceoEl = document.getElementById("ceoSection");
      const ceoTop = ceoEl ? ceoEl.getBoundingClientRect().top : 9999;

      // 1. 최상단 히어로 슬라이더 영역 판별
      if (ceoTop > scanLine + 50) {
        activeTarget = null;
      } else if ((window.innerHeight + scrollY) >= document.documentElement.scrollHeight - 50) {
        // 페이지 맨 끝(푸터 부근)
        activeTarget = "salesSection";
      } else {
        // 모든 섹션 중 상단 감지선(scanLine) 이하로 들어온 가장 최신 섹션 선택
        for (let i = sectionNavMapping.length - 1; i >= 0; i--) {
          const el = document.getElementById(sectionNavMapping[i].id);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= scanLine) {
              activeTarget = sectionNavMapping[i].target;
              break;
            }
          }
        }
      }

      // 2. 네비게이션 텍스트 활성화 (현재 섹션만 검은 글씨, 나머지 회색)
      let activeLinkEl = null;
      headerNavLinks.forEach((link) => {
        const target = link.getAttribute("data-target");
        if (activeTarget && target === activeTarget) {
          link.classList.add("active");
          activeLinkEl = link;
        } else {
          link.classList.remove("active");
        }
      });

      // 가로 스크롤 영역일 경우 현재 활성 탭이 화면 밖이면 부드럽게 스크롤 맞춤
      if (activeLinkEl && headerNav) {
        const navRect = headerNav.getBoundingClientRect();
        const linkRect = activeLinkEl.getBoundingClientRect();
        if (linkRect.left < navRect.left + 10 || linkRect.right > navRect.right - 10) {
          activeLinkEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }

      // 3. 상태표시줄(프로그레스 바): zoom 1.1 스케일 보정을 적용하여 활성 텍스트의 정확한 중간(중앙 X좌표)에 완벽 일치
      // 매출 성과를 다 보고 그 아래로 스크롤 시 프로그레스 바가 헤더 우측 끝(100%)까지 자연스럽게 진행
      if (progressBar) {
        if (!activeLinkEl || !activeTarget || !topHeader) {
          progressBar.style.width = "0px";
        } else {
          const headerRect = topHeader.getBoundingClientRect();
          const linkRect = activeLinkEl.getBoundingClientRect();

          // 뷰포트 상에서 헤더 좌측 끝부터 텍스트 가로 정중앙까지의 실제 픽셀 거리
          const realPixelDist = (linkRect.left + linkRect.width / 2) - headerRect.left;

          // .main-wrapper의 zoom: 1.1 스케일 왜곡 역보정
          const mainWrapper = document.querySelector(".main-wrapper");
          const zoomFactor = mainWrapper ? (parseFloat(getComputedStyle(mainWrapper).zoom) || 1.1) : 1;

          const adjustedWidth = realPixelDist / zoomFactor;

          // 매출 성과(salesSection) 및 그 아래 영역(엔딩 슬로건, 푸터) 스크롤 감지
          const salesEl = document.getElementById("salesSection");
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          let progressBelow = 0;

          if (activeTarget === "salesSection" && salesEl) {
            const salesRect = salesEl.getBoundingClientRect();
            // salesSection의 하단이 화면 안으로 올라왔을 때(매출 성과를 다 보고 아래로 스크롤 진행 중)
            if (salesRect.bottom <= window.innerHeight + 10) {
              const salesEndScrollY = scrollY - (window.innerHeight - salesRect.bottom);
              const remainingScroll = maxScroll - salesEndScrollY;
              if (remainingScroll > 20) {
                progressBelow = Math.min(1, Math.max(0, (scrollY - salesEndScrollY) / remainingScroll));
              } else {
                progressBelow = 1;
              }
            }
          }

          // 페이지 맨 끝에 도달했거나 progressBelow가 1에 근접한 경우 100% 끝까지 진행
          if ((window.innerHeight + scrollY) >= maxScroll - 30 || progressBelow >= 0.98) {
            progressBar.style.width = "100%";
          } else if (progressBelow > 0) {
            const totalHeaderWidth = (topHeader.offsetWidth || headerRect.width) / zoomFactor;
            const currentWidth = adjustedWidth + (totalHeaderWidth - adjustedWidth) * progressBelow;
            progressBar.style.width = Math.min(totalHeaderWidth, Math.round(currentWidth)) + "px";
          } else {
            progressBar.style.width = Math.max(0, Math.round(adjustedWidth)) + "px";
          }
        }
      }
    }

    // 상단 바 메뉴 클릭 시 부드럽게 해당 섹션으로 스크롤 이동
    headerNavLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("data-target");
        if (targetId) {
          e.preventDefault();
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            smoothScrollToElement(targetEl);
          }
        }
      });
    });

    window.addEventListener("scroll", updateNavAndProgress, { passive: true });
    window.addEventListener("resize", updateNavAndProgress);
    document.addEventListener("scroll", updateNavAndProgress, { passive: true });
    updateNavAndProgress();
  }

  // 기하학적 네모 모듈 및 기업 전략 텍스트 스크롤 인터랙션 제어
  const boxMotionSection = document.getElementById("boxMotionSection");
  const boxStage = document.getElementById("boxStage");
  const strategyItems = boxMotionSection
    ? Array.from(boxMotionSection.querySelectorAll(".strategy-item"))
    : [];

  if (boxMotionSection && boxStage && strategyItems.length > 0) {
    let currentStep = "step-1";
    let currentTextIndex = -1;
    boxStage.classList.add("step-1");

    function updateBoxMotion() {
      const rect = boxMotionSection.getBoundingClientRect();
      const sectionHeight = boxMotionSection.offsetHeight;
      const windowHeight = window.innerHeight;

      // 섹션 상단이 화면 상단에 도달한 후부터 스크롤 진행률 계산
      const scrollDistance = -rect.top;
      const totalScrollable = sectionHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollDistance / totalScrollable));

      // 1. 네모 모듈 5단계 형태 변화
      let nextStep = "step-1";
      if (progress < 0.15) {
        nextStep = "step-1"; // 1개 네모
      } else if (progress < 0.32) {
        nextStep = "step-2"; // 가로 4개 쫙 퍼짐
      } else if (progress < 0.50) {
        nextStep = "step-3"; // 불규칙 높낮이 배치
      } else if (progress < 0.70) {
        nextStep = "step-4"; // 위아래 파동 1
      } else {
        nextStep = "step-5"; // 위아래 파동 2
      }

      if (currentStep !== nextStep) {
        boxStage.classList.remove("step-1", "step-2", "step-3", "step-4", "step-5");
        boxStage.classList.add(nextStep);
        currentStep = nextStep;
      }

      // 2. 기업 전략 3가지 텍스트 순차 전환
      // 0 ~ 28%: Trust in Distribution
      // 28% ~ 55%: Smart-Technology
      // 55% ~ 100%: Shared-Growth Distribution (상생유통 유지 후 충분히 스크롤해야 다음 이미지 섹션 도달)
      let activeTextIdx = 0;
      if (progress < 0.28) {
        activeTextIdx = 0;
      } else if (progress < 0.55) {
        activeTextIdx = 1;
      } else {
        activeTextIdx = 2;
      }

      if (currentTextIndex !== activeTextIdx) {
        strategyItems.forEach((item, idx) => {
          if (idx === activeTextIdx) {
            item.classList.remove("prev");
            item.classList.add("active");
          } else if (idx < activeTextIdx) {
            item.classList.remove("active");
            item.classList.add("prev"); // 위로 사라짐
          } else {
            item.classList.remove("active", "prev"); // 아래 대기
          }
        });
        currentTextIndex = activeTextIdx;
      }
    }

    window.addEventListener("scroll", updateBoxMotion, { passive: true });
    window.addEventListener("resize", updateBoxMotion);
    updateBoxMotion();
  }

  // =========================================
  // 모바일 전용: 비전 섹션 스크롤 체류 및 기업 전략 3개 순차 체류 + 네모 모듈 동적 모션
  // 1단계(0~16%): "정채움 비전" 단독 화면 중앙 체류
  // 전환(16~28%): "정채움 비전" 상단 이동 & 하단 전략 영역(선 + 네모 + 텍스트) 상승
  // 2단계(28~50%): [전략 1] 유통의 신뢰 (Trust in Distribution) + 네모 1개(step-1)
  // 3단계(50~74%): [전략 2] 스마트 기술 (Smart-Technology) + 네모 4개 전개(step-2)
  // 4단계(74~88%): [전략 3] 상생 유통 (Shared-Growth Distribution) + 6개 네모 리듬 배치(step-3)
  // 5단계(88~100%): [전략 3] 상생 유통 지속 + 6개 네모 파동 모션(step-4)
  // 100% 이후: 다음 섹션(R&D)으로 자연스럽게 스크롤 통과 (R&D 체류 없음)
  // =========================================
  const mobileVisionSection = document.getElementById("visionSection");
  const mobileVisionContentWrapper = mobileVisionSection
    ? mobileVisionSection.querySelector(".vision-content-wrapper")
    : null;
  const mobileStrategyContainer = document.getElementById("visionMobileStrategyContainer");
  const mobileBoxStage = document.getElementById("visionMobileBoxStage");
  let currentMobileStrategyIdx = -1;
  let currentMobileBoxStep = "step-1";

  function setMobileBoxStep(nextStep) {
    if (!mobileBoxStage || currentMobileBoxStep === nextStep) return;
    mobileBoxStage.classList.remove("step-1", "step-2", "step-3", "step-4", "step-5");
    mobileBoxStage.classList.add(nextStep);
    currentMobileBoxStep = nextStep;
  }

  function setMobileStrategyItem(activeIdx) {
    if (currentMobileStrategyIdx === activeIdx) return;
    currentMobileStrategyIdx = activeIdx;
    if (!mobileStrategyContainer) return;
    const items = mobileStrategyContainer.querySelectorAll(".strategy-item");
    items.forEach((item, idx) => {
      if (idx === activeIdx) {
        item.classList.remove("prev");
        item.classList.add("active");
      } else if (idx < activeIdx) {
        item.classList.remove("active");
        item.classList.add("prev");
      } else {
        item.classList.remove("active", "prev");
      }
    });
  }

  function updateMobileVisionInteraction() {
    if (!mobileVisionSection || !mobileVisionContentWrapper || !mobileStrategyContainer) return;

    if (window.innerWidth > 768) {
      mobileVisionContentWrapper.style.transform = "";
      mobileStrategyContainer.style.transform = "";
      mobileStrategyContainer.style.opacity = "";
      mobileStrategyContainer.style.pointerEvents = "";
      const visionSticky = mobileVisionSection.querySelector(".vision-sticky-wrapper");
      if (visionSticky) visionSticky.style.backgroundColor = "";
      mobileVisionSection.style.backgroundColor = "";
      currentMobileStrategyIdx = -1;
      setMobileBoxStep("step-1");
      return;
    }

    const rect = mobileVisionSection.getBoundingClientRect();
    const sectionHeight = mobileVisionSection.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollDistance = -rect.top;
    const totalScrollable = sectionHeight - windowHeight;

    if (totalScrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, scrollDistance / totalScrollable));

    // 비전 섹션 끝자락(0.80 ~ 1.00)에서 R&D로 넘어갈 때 배경색을 베이지(#ece4de)에서 순백색(#ffffff)으로 부드럽고 자연스럽게 전환
    const visionSticky = mobileVisionSection.querySelector(".vision-sticky-wrapper");
    if (visionSticky) {
      if (progress > 0.80) {
        const ratio = (progress - 0.80) / (1 - 0.80);
        const r = Math.round(236 + (255 - 236) * ratio);
        const g = Math.round(228 + (255 - 228) * ratio);
        const b = Math.round(222 + (255 - 222) * ratio);
        visionSticky.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        mobileVisionSection.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      } else {
        visionSticky.style.backgroundColor = "";
        mobileVisionSection.style.backgroundColor = "";
      }
    }

    if (progress < 0.16) {
      // 1단계: 정채움 비전 타이틀은 상단 고정, 카드와 전략만 아래로 배치된 상태 유지
      mobileVisionContentWrapper.style.transform = "translateY(0px)";
      mobileStrategyContainer.style.transform = "translateY(125px)";
      mobileStrategyContainer.style.opacity = "0";
      mobileStrategyContainer.style.pointerEvents = "none";
      setMobileStrategyItem(0);
      setMobileBoxStep("step-1");
    } else if (progress < 0.28) {
      // 전환: 상단 타이틀은 고정된 채, 하단 전략 영역만 부드럽게 55px 위치로 상승 & 페이드인
      const t = (progress - 0.16) / (0.28 - 0.16);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const sY = 55 + (1 - ease) * 70;
      mobileVisionContentWrapper.style.transform = "translateY(0px)";
      mobileStrategyContainer.style.transform = `translateY(${sY}px)`;
      mobileStrategyContainer.style.opacity = ease.toFixed(3);
      mobileStrategyContainer.style.pointerEvents = ease > 0.5 ? "auto" : "none";
      setMobileStrategyItem(0);
      setMobileBoxStep("step-1");
    } else {
      // 2~5단계: 상단 타이틀 고정 + 핑크색 영역(카드 & 전략) 55px 하단 위치에서 체류 모션 수행
      mobileVisionContentWrapper.style.transform = "translateY(0px)";
      mobileStrategyContainer.style.transform = "translateY(55px)";
      mobileStrategyContainer.style.opacity = "1";
      mobileStrategyContainer.style.pointerEvents = "auto";

      // 0.28 ~ 0.50: 전략 1 (유통의 신뢰) + 1개 다이아몬드 (step-1)
      // 0.50 ~ 0.74: 전략 2 (스마트 기술) + 4개 펼쳐짐 (step-2)
      // 0.74 ~ 0.88: 전략 3 (상생 유통) + 6개 리듬 배치 (step-3)
      // 0.88 ~ 1.00: 전략 3 (상생 유통 유지) + 6개 파동 웨이브 (step-4)
      if (progress < 0.50) {
        setMobileStrategyItem(0);
        setMobileBoxStep("step-1");
      } else if (progress < 0.74) {
        setMobileStrategyItem(1);
        setMobileBoxStep("step-2");
      } else if (progress < 0.88) {
        setMobileStrategyItem(2);
        setMobileBoxStep("step-3");
      } else {
        setMobileStrategyItem(2);
        setMobileBoxStep("step-4");
      }
    }
  }

  window.addEventListener("scroll", updateMobileVisionInteraction, { passive: true });
  window.addEventListener("resize", updateMobileVisionInteraction);
  updateMobileVisionInteraction();

  // 한우고집쟁이 기하학적 세모 모듈 및 핵심역량 텍스트 스크롤 인터랙션 제어
  const hanwooMotionSection = document.getElementById("hanwooMotionSection");
  const triangleStage = document.getElementById("triangleStage");
  const hanwooStrategyItems = hanwooMotionSection
    ? Array.from(hanwooMotionSection.querySelectorAll(".strategy-item"))
    : [];

  if (hanwooMotionSection && triangleStage && hanwooStrategyItems.length > 0) {
    let currentTriangleStep = "step-1";
    let currentHanwooTextIndex = -1;
    triangleStage.classList.add("step-1");

    function updateTriangleMotion() {
      const rect = hanwooMotionSection.getBoundingClientRect();
      const sectionHeight = hanwooMotionSection.offsetHeight;
      const windowHeight = window.innerHeight;

      // 섹션 상단이 화면 상단에 도달한 후부터 스크롤 진행률 계산
      const scrollDistance = -rect.top;
      const totalScrollable = sectionHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrollDistance / totalScrollable));

      // 1. 세모 모듈 5단계 형태 변화
      let nextStep = "step-1";
      if (progress < 0.15) {
        nextStep = "step-1";
      } else if (progress < 0.32) {
        nextStep = "step-2";
      } else if (progress < 0.50) {
        nextStep = "step-3";
      } else if (progress < 0.70) {
        nextStep = "step-4";
      } else {
        nextStep = "step-5";
      }

      if (currentTriangleStep !== nextStep) {
        triangleStage.classList.remove("step-1", "step-2", "step-3", "step-4", "step-5");
        triangleStage.classList.add(nextStep);
        currentTriangleStep = nextStep;
      }

      // 2. 4가지 핵심역량 텍스트 순차 전환
      // 0 ~ 25%: Optimal Fresh Delivery
      // 25% ~ 50%: Systematic Production
      // 50% ~ 75%: HACCP Certified
      // 75% ~ 100%: Special Skin Packaging
      let activeTextIdx = 0;
      if (progress < 0.25) {
        activeTextIdx = 0;
      } else if (progress < 0.50) {
        activeTextIdx = 1;
      } else if (progress < 0.75) {
        activeTextIdx = 2;
      } else {
        activeTextIdx = 3;
      }

      if (currentHanwooTextIndex !== activeTextIdx) {
        hanwooStrategyItems.forEach((item, idx) => {
          if (idx === activeTextIdx) {
            item.classList.remove("prev");
            item.classList.add("active");
          } else if (idx < activeTextIdx) {
            item.classList.remove("active");
            item.classList.add("prev"); // 위로 사라짐
          } else {
            item.classList.remove("active", "prev"); // 아래 대기
          }
        });
        currentHanwooTextIndex = activeTextIdx;
      }
    }

    window.addEventListener("scroll", updateTriangleMotion, { passive: true });
    window.addEventListener("resize", updateTriangleMotion);
    updateTriangleMotion();
  }

  // =========================================
  // 운영 브랜드 (정채움) 인트로 타이틀 -> 쇼케이스 체류 전환 인터랙션
  // =========================================
  const brandSection = document.getElementById("brandSection");
  const brandTitleStage = document.getElementById("brandTitleStage");
  const brandShowcaseContainer = document.getElementById("brandShowcaseContainer");

  if (brandSection && brandTitleStage && brandShowcaseContainer) {
    let brandAutoTimer = null;
    let hasAutoTriggered = false;

    function updateBrandSectionMotion() {
      // 모바일 화면(768px 이하)에서는 스크롤 체류 효과 없이 타이틀과 쇼케이스 상시 노출 유지
      if (window.innerWidth <= 768) {
        if (brandTitleStage) brandTitleStage.classList.remove("hidden");
        if (brandShowcaseContainer) brandShowcaseContainer.classList.add("visible");
        return;
      }

      const rect = brandSection.getBoundingClientRect();
      const sectionHeight = brandSection.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollDistance = -rect.top;
      const totalScrollable = sectionHeight - windowHeight;

      if (totalScrollable <= 0) {
        brandTitleStage.classList.add("hidden");
        brandShowcaseContainer.classList.add("visible");
        return;
      }

      // 섹션이 화면에 진입했는지 확인
      const isEntered = rect.top <= windowHeight * 0.4 && rect.bottom >= windowHeight * 0.2;
      const progress = Math.max(0, Math.min(1, scrollDistance / totalScrollable));

      if (progress < 0.18 && !hasAutoTriggered) {
        brandTitleStage.classList.remove("hidden");
        brandShowcaseContainer.classList.remove("visible");

        // 진입 시 사용자가 가만히 머물 경우 2초 후 자동 전환 타이머 동작
        if (isEntered && !brandAutoTimer) {
          brandAutoTimer = setTimeout(() => {
            hasAutoTriggered = true;
            brandTitleStage.classList.add("hidden");
            brandShowcaseContainer.classList.add("visible");
          }, 2000);
        }
      } else {
        // 스크롤이 진행되었거나 타이머 완료 시 전환
        if (brandAutoTimer) {
          clearTimeout(brandAutoTimer);
          brandAutoTimer = null;
        }
        brandTitleStage.classList.add("hidden");
        brandShowcaseContainer.classList.add("visible");
      }

      // 섹션에서 완전히 벗어나 위로 올라갔을 때 리셋
      if (rect.top > windowHeight * 0.7) {
        hasAutoTriggered = false;
        if (brandAutoTimer) {
          clearTimeout(brandAutoTimer);
          brandAutoTimer = null;
        }
        brandTitleStage.classList.remove("hidden");
        brandShowcaseContainer.classList.remove("visible");
      }
    }

    window.addEventListener("scroll", updateBrandSectionMotion, { passive: true });
    window.addEventListener("resize", updateBrandSectionMotion);
    updateBrandSectionMotion();
  }

  // =========================================
  // 연도별 타임라인 스크롤 인터랙션 제어
  // (현재 연도/항목 화면 세로 정중앙 고정 & 위/아래 흐림 인터랙션)
  // =========================================
  const timelineSection = document.getElementById("timelineScrollSection");
  const yearSlotAbove = document.getElementById("yearSlotAbove");
  const yearSlotCurrent = document.getElementById("yearSlotCurrent");
  const yearSlotBelowStack = document.getElementById("yearSlotBelowStack");
  const timelineContentsRoller = document.getElementById("timelineContentsRoller");
  const timelineMilestones = Array.from(document.querySelectorAll(".timeline-milestone-item"));
  const yearsList = ["2026", "2025", "2024", "2023", "2021", "2020", "2013"];

  if (timelineSection && yearSlotCurrent && timelineMilestones.length > 0) {
    let currentMilestoneIdx = -1;
    let currentYearShown = "";

    function renderYearSlots(yearStr) {
      if (currentYearShown === yearStr) return;
      currentYearShown = yearStr;

      const yearIdx = yearsList.indexOf(yearStr);
      if (yearIdx === -1) return;

      // 1. 현재 활성 연도 (4자리, 화면 세로 정중앙 영구 고정)
      yearSlotCurrent.textContent = yearStr;

      // 2. 상단 지나간 연도 (세로 중앙 위쪽 흐림: 24, 21 등)
      if (yearSlotAbove) {
        if (yearIdx - 1 >= 0) {
          yearSlotAbove.textContent = yearsList[yearIdx - 1].slice(-2);
          yearSlotAbove.style.opacity = "0.32";
          yearSlotAbove.style.visibility = "visible";
        } else {
          yearSlotAbove.textContent = "";
          yearSlotAbove.style.opacity = "0";
          yearSlotAbove.style.visibility = "hidden";
        }
      }

      // 3. 하단 다가올 연도들 (세로 중앙 아래쪽 흐림)
      if (yearSlotBelowStack) {
        yearSlotBelowStack.innerHTML = "";

        // 바로 아래 연도 (45% 불투명도)
        if (yearIdx + 1 < yearsList.length) {
          const below1 = document.createElement("div");
          below1.className = "year-slot-below below-1";
          below1.textContent = yearsList[yearIdx + 1].slice(-2);
          yearSlotBelowStack.appendChild(below1);
        }

        // 다다음 연도 (20% 불투명도 + 마스크 그라데이션)
        if (yearIdx + 2 < yearsList.length) {
          const below2 = document.createElement("div");
          below2.className = "year-slot-below below-2";
          below2.textContent = yearsList[yearIdx + 2].slice(-2);
          yearSlotBelowStack.appendChild(below2);
        }
      }
    }

    function positionContentsRoller(activeIdx) {
      if (!timelineContentsRoller) return;

      // 각 연혁 항목의 클래스 지정 (active: 진함 / prev-item, next-item: 사진처럼 흐림)
      timelineMilestones.forEach((item, idx) => {
        item.classList.remove("active", "prev-item", "next-item", "far-item");
        if (idx === activeIdx) {
          item.classList.add("active");
        } else if (idx === activeIdx - 1) {
          item.classList.add("prev-item"); // 바로 위 항목 흐리게
        } else if (idx === activeIdx + 1) {
          item.classList.add("next-item"); // 바로 아래 항목 흐리게
        } else {
          item.classList.add("far-item");  // 그 외 항목
        }
      });

      // 현재 활성 항목이 세로 정중앙에 정확히 오도록 roller Y축 오프셋 계산
      const targetItem = timelineMilestones[activeIdx];
      if (targetItem) {
        const itemTop = targetItem.offsetTop;
        const itemHeight = targetItem.offsetHeight;
        // roller의 top이 50%이므로, -(itemTop + itemHeight / 2)가 정확히 화면 세로 정중앙선에 일치함
        const targetOffset = -(itemTop + (itemHeight / 2));
        timelineContentsRoller.style.transform = `translateY(${targetOffset}px)`;
      }
    }

    function updateTimelineScroll() {
      const rect = timelineSection.getBoundingClientRect();
      const sectionHeight = timelineSection.offsetHeight;
      const windowHeight = window.innerHeight;

      // 섹션 상단이 상단 90px 헤더 지점에 닿았을 때부터 체류 진행률 계산
      const scrollDistance = -(rect.top - 90);
      const totalScrollable = sectionHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(0.999, scrollDistance / totalScrollable));

      // 총 12개 개별 연혁 항목 단계
      const count = timelineMilestones.length;
      let activeIdx = Math.floor(progress * count);
      activeIdx = Math.max(0, Math.min(count - 1, activeIdx));

      if (currentMilestoneIdx !== activeIdx) {
        currentMilestoneIdx = activeIdx;

        const currentMilestoneYear = timelineMilestones[activeIdx].getAttribute("data-year") || "2026";

        // 1. 좌측 연도 슬롯 갱신 (2025년 항목 7개가 끝날 때까지 연도는 2025 유지)
        renderYearSlots(currentMilestoneYear);

        // 2. 우측 개별 연혁 항목 롤러 이동 (현재 항목 세로 정중앙 + 위/아래 흐림 처리)
        positionContentsRoller(activeIdx);
      }

      // 글씨(연도 숫자 및 연혁 내용)는 선명하게 유지하고, 연도 뒤의 배경색만 끝부분에서 자연스럽게 흰색으로 옅어지도록 처리
      const yearPanel = timelineSection.querySelector(".timeline-year-panel");
      if (yearPanel) {
        if (progress > 0.86) {
          const fadeProgress = Math.min(1, (progress - 0.86) / 0.14);
          // 그라데이션을 유지하면서 끝부분에서 자연스럽게 화이트 배경과 융합되도록 불투명도 조절
          yearPanel.style.opacity = Math.max(0.05, 1 - fadeProgress * 0.95);
        } else {
          yearPanel.style.opacity = "1";
        }
      }
    }

    // 초기화: 2026년 및 1번째 항목인 "식품 가공 명장 선정" 세로 정중앙 배치
    renderYearSlots("2026");
    setTimeout(() => {
      positionContentsRoller(0);
    }, 80);

    window.addEventListener("scroll", updateTimelineScroll, { passive: true });
    window.addEventListener("resize", () => {
      positionContentsRoller(currentMilestoneIdx >= 0 ? currentMilestoneIdx : 0);
      updateTimelineScroll();
    });
    updateTimelineScroll();
  }

  /* =========================================
     매출 성과 섹션 인터랙션 (스크롤 체류 시작 시 숫자 카운팅 & 꺾은선 차트 드로잉)
     ========================================= */
  const salesSection = document.getElementById("salesSection");
  if (salesSection) {
    let salesAnimated = false;
    let animFrameId = null;

    const isMobile = () => window.innerWidth <= 768;

    const setStaticSalesNumbers = () => {
      const counters = salesSection.querySelectorAll(".sales-counter");
      counters.forEach((counter) => {
        const target = counter.getAttribute("data-target");
        if (target) counter.textContent = target;
      });
      const chartCard = salesSection.querySelector(".sales-chart-card");
      if (chartCard) {
        chartCard.classList.add("animated");
      }
      salesSection.querySelectorAll(".scroll-fade").forEach((el) => {
        el.classList.add("visible");
      });
    };

    // 모바일 초기 진입 시 즉시 정적 수치 고정 (어트랙션 제거)
    if (isMobile()) {
      setStaticSalesNumbers();
    }

    const animateSalesNumbers = () => {
      const counters = salesSection.querySelectorAll(".sales-counter");
      const duration = 1600; // ms
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 부드러운 감속 이징 (easeOutQuart)
        const easeProgress = 1 - Math.pow(1 - progress, 4);

        counters.forEach((counter) => {
          const target = parseFloat(counter.getAttribute("data-target")) || 0;
          const decimals = parseInt(counter.getAttribute("data-decimals") || "0", 10);
          const currentVal = easeProgress * target;

          if (decimals > 0) {
            counter.textContent = currentVal.toFixed(decimals);
          } else {
            counter.textContent = Math.round(currentVal).toString();
          }

          if (progress >= 1) {
            counter.textContent = decimals > 0 ? target.toFixed(decimals) : target.toString();
          }
        });

        if (progress < 1) {
          animFrameId = requestAnimationFrame(updateCount);
        }
      };

      animFrameId = requestAnimationFrame(updateCount);
    };

    const triggerSalesAnimation = () => {
      if (isMobile()) {
        setStaticSalesNumbers();
        return;
      }
      if (salesAnimated) return;
      salesAnimated = true;

      // 1. 내부 요소들 가시화 보장
      salesSection.querySelectorAll(".scroll-fade").forEach((el) => {
        el.classList.add("visible");
      });

      // 2. 차트 카드 애니메이션 활성화 (꺾은선 드로잉 & 포인트 노출 & 상승률 배지)
      const chartCard = salesSection.querySelector(".sales-chart-card");
      if (chartCard) {
        chartCard.classList.add("animated");
      }

      // 3. 지표 숫자 카운팅 효과 실행
      animateSalesNumbers();
    };

    const resetSalesAnimation = () => {
      if (isMobile()) return;
      if (!salesAnimated) return;
      salesAnimated = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      const counters = salesSection.querySelectorAll(".sales-counter");
      counters.forEach((counter) => {
        counter.textContent = "0";
      });
      const chartCard = salesSection.querySelector(".sales-chart-card");
      if (chartCard) {
        chartCard.classList.remove("animated");
      }
    };

    const checkSalesSticky = () => {
      if (isMobile()) {
        setStaticSalesNumbers();
        return;
      }
      const rect = salesSection.getBoundingClientRect();

      // 스크롤 체류(Sticky) 효과가 시작되는 시점:
      // salesSection의 상단이 화면 상단(top <= 10px)에 도달하여 고정 체류될 때 카운팅 시작
      if (rect.top <= 10 && rect.bottom >= window.innerHeight * 0.3) {
        if (!salesAnimated) {
          triggerSalesAnimation();
        }
      } else if (rect.top > window.innerHeight * 0.8) {
        // 사용자가 다시 위로 스크롤하여 섹션 밖으로 완전히 벗어났을 때 리셋하여 재진입 시 다시 체류 카운팅이 되도록 함
        resetSalesAnimation();
      }
    };

    window.addEventListener("scroll", checkSalesSticky, { passive: true });
    window.addEventListener("resize", checkSalesSticky, { passive: true });
    checkSalesSticky();
  }

  // ==========================================
  // 플로팅 맨 위로 이동 (Scroll To Top) 버튼
  // ==========================================
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (scrollToTopBtn) {
    const handleScrollBtnVisibility = () => {
      if (window.scrollY > 280) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    };

    window.addEventListener("scroll", handleScrollBtnVisibility, { passive: true });
    handleScrollBtnVisibility();

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});


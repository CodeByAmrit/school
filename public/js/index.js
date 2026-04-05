async function getTotalStudents() {
  try {
    const response = await fetch(`/total-students`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

async function updateStudentCount() {
  const total_data = await getTotalStudents();
  document.getElementById("student").innerText =
    total_data.total_students.toString() + "+";
  document.getElementById("teacher").innerText =
    total_data.total_teachers.toString() + "+";
}

document.addEventListener("DOMContentLoaded", () => {
  updateStudentCount();
  
  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Mobile menu toggle logic
  const toggleBtn = document.querySelector('[data-collapse-toggle="navbar-default"]');
  const menu = document.getElementById('navbar-default');
  
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function() {
      menu.classList.toggle('hidden');
    });
  }

  // --- GSAP Animations ---
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

    // Initial Hero Animation
    const heroTl = gsap.timeline();
    heroTl.to(".gsap-reveal-hero", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
    });

    // Section Reveals (Fade + Slide Up)
    gsap.utils.toArray(".gsap-reveal").forEach(section => {
      gsap.to(section, {
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      });
    });

    // Advanced Success Journey Motion Path
    const journeyTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#success-journey",
        start: "top 60%",
        end: "bottom 80%",
        scrub: 1.5, // Syncs animation progress perfectly with scroll
      }
    });

    // 1. Draw the curvy path
    const path = document.querySelector("#motion-path");
    if (path) {
      const pathLength = path.getTotalLength();
      gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
      
      journeyTl.to(path, {
        strokeDashoffset: 0,
        duration: 2,
        ease: "none"
      });
    }

    // 2. Fly the plane along the path
    const motionObj = document.querySelector("#motion-object");
    if (motionObj && path) {
      journeyTl.to(motionObj, {
        motionPath: {
          path: "#motion-path",
          align: "#motion-path",
          autoRotate: true,
          alignOrigin: [0.5, 0.5]
        },
        opacity: 1,
        duration: 2,
        ease: "none"
      }, 0); // Start at same time as path drawing
    }

    // Staggered Item Reveals (Cards, Grid Items)
    gsap.utils.toArray(".grid").forEach(grid => {
      const items = grid.querySelectorAll(".gsap-reveal-item");
      if (items.length > 0) {
        gsap.to(items, {
          scrollTrigger: {
            trigger: grid,
            start: "top 80%",
            toggleActions: "play none none none"
          },
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)"
        });
      }
    });

    // Floating Animations for stage icons
    gsap.to(".floating-element", {
      y: -10,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      stagger: {
        amount: 1,
        from: "center"
      }
    });
  }
});

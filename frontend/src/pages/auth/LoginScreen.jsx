import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axiosClient from "../../api/axiosClient";
import axios from "axios";
import parkingBg from "../../assets/parking-bg.jpg";
import cctvVid from "../../assets/cctv-scan.mp4";
import parkingVid from "../../assets/parking-lot.mp4";
import driveVid from "../../assets/car-drive.mp4";
import cityVid from "../../assets/highway-traffic.mp4";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const css = `

  @keyframes fadeInUp { 
    from { opacity: 0; transform: translateY(30px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
  @keyframes fadeIn { 
    from { opacity: 0; } 
    to { opacity: 1; } 
  }
  @keyframes slideDown { 
    from { opacity: 0; transform: translateY(-20px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
  @keyframes scaleIn { 
    from { opacity: 0; transform: scale(0.95); } 
    to { opacity: 1; transform: scale(1); } 
  }
  @keyframes marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .slide-img {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transform: translateZ(0) scale(1.02);
    will-change: opacity;
  }

  .animate-marquee {
    display: flex;
    width: max-content;
    animation: marquee 30s linear infinite;
  }
  .animate-marquee:hover {
    animation-play-state: paused;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #030712;
  }
  ::-webkit-scrollbar-thumb {
    background: #111827;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #00ff87;
  }

  .nav-link { 
    color: rgba(243, 244, 246, 0.8); 
    text-decoration: none; 
    font-size: 15px; 
    font-weight: 500;
    padding: 8px 16px; 
    border-radius: 9999px; 
    transition: all 0.3s ease; 
  }
  .nav-link:hover { 
    color: #00ff87; 
    background: rgba(0, 255, 135, 0.08); 
  }

  .hero-btn { 
    display: inline-flex; 
    align-items: center; 
    gap: 10px; 
    padding: 14px 32px;
    border-radius: 14px; 
    font-size: 15px; 
    font-weight: 600; 
    cursor: pointer; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none; 
    border: none; 
  }
  .hero-btn:hover { 
    transform: translateY(-3px); 
    box-shadow: 0 10px 25px -5px rgba(0, 255, 135, 0.3);
  }

  .modal-input { 
    width: 100%; 
    height: 52px; 
    padding: 0 18px; 
    font-size: 14px; 
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08); 
    background: rgba(255, 255, 255, 0.03); 
    color: #fff; 
    outline: none;
    box-sizing: border-box; 
    transition: all 0.25s ease; 
    font-family: inherit; 
  }
  .modal-input:focus { 
    border-color: #00ff87; 
    background: rgba(255, 255, 255, 0.06); 
    box-shadow: 0 0 0 3px rgba(0, 255, 135, 0.15); 
  }
  .modal-input::placeholder { 
    color: #4b5563; 
  }

  .modal-overlay { 
    position: fixed; 
    inset: 0; 
    z-index: 100; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    background: rgba(3, 7, 18, 0.9); 
    backdrop-filter: blur(12px); 
    animation: fadeIn 0.25s ease; 
  }
  .modal-card { 
    background: #0b0f19; 
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px; 
    padding: 40px; 
    width: 100%; 
    max-width: 440px;
    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8); 
    animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); 
    position: relative; 
  }

  .submit-btn { 
    width: 100%; 
    height: 52px; 
    border-radius: 12px; 
    border: none;
    background: linear-gradient(135deg, #00ff87, #00b359); 
    color: #030712; 
    font-size: 15px;
    font-weight: 700; 
    cursor: pointer; 
    transition: all 0.25s ease; 
    font-family: inherit; 
  }
  .submit-btn:hover:not(:disabled) { 
    background: linear-gradient(135deg, #1aff9c, #00cc66);
    box-shadow: 0 8px 24px rgba(0, 255, 135, 0.35); 
    transform: translateY(-1px); 
  }
  .submit-btn:disabled { 
    opacity: 0.6; 
    cursor: not-allowed; 
  }

  .glass-card {
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.74));
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.45);
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    will-change: transform;
  }
  .glass-card:hover {
    transform: translate3d(0, -5px, 0);
    border-color: rgba(0, 255, 135, 0.25);
    box-shadow: 0 20px 40px rgba(0, 255, 135, 0.06);
  }

  .text-glow {
    text-shadow: 0 0 30px rgba(0, 255, 135, 0.35);
  }

  .text-glow-blue {
    text-shadow: 0 0 30px rgba(59, 130, 246, 0.35);
  }

  .hero-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(52px);
    opacity: 0.22;
    pointer-events: none;
  }

  .metric-pill {
    background: rgba(2, 6, 23, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  }

  .media-card {
    position: relative;
    overflow: hidden;
    border-radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72));
    box-shadow: 0 32px 100px rgba(0, 0, 0, 0.48);
  }

  .hero-device {
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 255, 135, 0.08) inset;
  }

  .evcare-chip {
    background: rgba(0, 255, 135, 0.1);
    border: 1px solid rgba(0, 255, 135, 0.22);
    color: #86efac;
  }

  /* ====== SECTION VISUAL VARIETY ====== */
  .section-glow-green {
    position: relative;
    background: linear-gradient(180deg, #030712 0%, #061a12 50%, #030712 100%);
  }
  .section-glow-green::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ff87, transparent);
  }

  .section-glow-blue {
    position: relative;
    background: linear-gradient(180deg, #030712 0%, #0a1628 50%, #030712 100%);
  }
  .section-glow-blue::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  }

  .section-glow-purple {
    position: relative;
    background: linear-gradient(180deg, #030712 0%, #130f1e 50%, #030712 100%);
  }
  .section-glow-purple::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #a855f7, transparent);
  }

  .section-glow-amber {
    position: relative;
    background: linear-gradient(180deg, #030712 0%, #1a150a 50%, #030712 100%);
  }
  .section-glow-amber::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
  }

  .section-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(120px);
    opacity: 0.07;
    pointer-events: none;
    z-index: 0;
  }

  /* Scanline animation for QR Mockup */
  @keyframes scan {
    0% { top: 0%; }
    50% { top: 100%; }
    100% { top: 0%; }
  }
  .scanline {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #00ff87;
    box-shadow: 0 0 10px #00ff87;
    animation: scan 3s linear infinite;
    pointer-events: none;
  }
`;

const SLIDES = [
  parkingBg,
  "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1920&q=80",
];

export function LoginScreen({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const landingContainerRef = useRef(null);

  useEffect(() => {
    if (showLogin) return; // Only animate landing page elements when visible

    // Set a slight timeout to ensure all DOM elements are rendered
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // 1. Hero Text & Orb Anim
        gsap.fromTo(".hero-title-gsap",
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: "power4.out" }
        );
        gsap.fromTo(".hero-desc-gsap",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, delay: 0.3, ease: "power2.out" }
        );
        gsap.fromTo(".hero-metric-gsap",
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, delay: 0.5, stagger: 0.1, ease: "back.out(1.2)" }
        );
        gsap.fromTo(".hero-btn-gsap",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.7, stagger: 0.15, ease: "power2.out" }
        );
        gsap.fromTo(".hero-orb",
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 0.22, duration: 2.2, ease: "elastic.out(1, 0.5)", stagger: 0.4 }
        );

        // 2. Stats & Trust Panel Scroll Trigger
        gsap.fromTo(".trust-panel-gsap",
          { y: 80, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".trust-panel-gsap",
              start: "top 88%",
              toggleActions: "play none none none"
            }
          }
        );

        // 3. Workflow Stepper Section Title & Stepper Items Scroll Trigger
        gsap.fromTo(".stepper-header-gsap",
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".stepper-header-gsap",
              start: "top 85%"
            }
          }
        );
        gsap.fromTo(".stepper-item-gsap",
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".stepper-item-gsap",
              start: "top 80%"
            }
          }
        );
        gsap.fromTo(".stepper-mockup-gsap",
          { y: 100, opacity: 0, rotateY: -15, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: ".stepper-mockup-gsap",
              start: "top 75%"
            }
          }
        );

        // 4. Services Loop Section Title & Marquee Scroll Trigger
        gsap.fromTo(".services-header-gsap",
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".services-header-gsap",
              start: "top 85%"
            }
          }
        );
        gsap.fromTo(".services-showcase-gsap",
          { y: 70, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".services-showcase-gsap",
              start: "top 80%"
            }
          }
        );

        // 5. Testimonials Section Scroll Trigger
        gsap.fromTo(".testimonials-header-gsap",
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".testimonials-header-gsap",
              start: "top 85%"
            }
          }
        );
        gsap.fromTo(".testimonial-card-gsap",
          { y: 60, opacity: 0, rotateX: 10 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.85,
            stagger: 0.18,
            ease: "back.out(1.1)",
            scrollTrigger: {
              trigger: ".testimonial-card-gsap",
              start: "top 80%"
            }
          }
        );
        gsap.fromTo(".testimonial-showcase-gsap",
          { scale: 0.96, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.95,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".testimonial-showcase-gsap",
              start: "top 80%"
            }
          }
        );

        // 6. Contact Section Scroll Trigger
        gsap.fromTo(".contact-header-gsap",
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".contact-header-gsap",
              start: "top 85%"
            }
          }
        );
        gsap.fromTo(".contact-info-gsap",
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".contact-info-gsap",
              start: "top 80%"
            }
          }
        );
        gsap.fromTo(".contact-form-gsap",
          { x: 50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".contact-form-gsap",
              start: "top 80%"
            }
          }
        );

      }, landingContainerRef);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [showLogin]);
  const [isSignUp, setIsSignUp] = useState(false); // Quản lý trạng thái Đăng ký tài khoản
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // State đăng ký họ tên
  const [licensePlate, setLicensePlate] = useState(""); // State đăng ký biển số xe
  const [confirmPassword, setConfirmPassword] = useState(""); // State xác nhận mật khẩu
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Interactive Stepper active state
  const [activeStep, setActiveStep] = useState(0);

  // Stats Counters
  const [activeVehicles, setActiveVehicles] = useState(124);

  // Public parking info for guests (no auth needed)
  const [publicInfo, setPublicInfo] = useState(null);
  useEffect(() => {
    const fetchPublicInfo = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
        const res = await axios.get(`${baseURL}/public/parking-info`);
        setPublicInfo(res.data.data);
      } catch (err) {
        console.warn("Could not load public parking info:", err);
      }
    };
    fetchPublicInfo();
    const interval = setInterval(fetchPublicInfo, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scrolled state for transparent navbar overlay on slideshow background
  const [isScrolled, setIsScrolled] = useState(false);

  // Live vehicles simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVehicles(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(90, Math.min(180, newCount));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatusPill = ({ color, label }) => {
    const styles = {
      emerald: "bg-emerald-400/10 text-emerald-200 border-emerald-300/15",
      sky: "bg-sky-400/10 text-sky-200 border-sky-300/15",
      amber: "bg-amber-300/10 text-amber-100 border-amber-200/15",
    };

    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[color]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {label}
      </span>
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem(`accessToken_${user.role}`, accessToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
        })
      );

      const roleMap = {
        DRIVER: "driver",
        STAFF: "staff",
        MANAGER: "manager",
        ADMIN: "admin",
        SECURITY: "security",
      };
      const mappedRole = roleMap[user.role] || "driver";
      onLogin(mappedRole);
    } catch (err) {
      setError(
        err.response?.data?.message || "Email hoặc mật khẩu không đúng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSignupSuccess(false);

    // Kiểm tra mật khẩu khớp
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      await axiosClient.post("/auth/register", {
        email,
        password,
        fullName,
        licensePlate: "",
        role: "DRIVER",
      });
      setSignupSuccess(true);
      setIsSignUp(false); // Trở về đăng nhập
      alert("Đăng ký thành công! Bạn có thể sử dụng tài khoản này để đăng nhập.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng ký thất bại. Email có thể đã được đăng ký trước đó."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========== GOOGLE OAUTH ==========
  const processOAuth2Login = useCallback(async (provider, email, fullName) => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.post("/auth/oauth2", {
        provider,
        email,
        fullName,
      });
      const { accessToken, user } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem(`accessToken_${user.role}`, accessToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
        })
      );
      const roleMap = {
        DRIVER: "driver",
        STAFF: "staff",
        MANAGER: "manager",
        ADMIN: "admin",
        SECURITY: "security",
      };
      onLogin(roleMap[user.role] || "driver");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập " + provider + " thất bại.");
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // Lấy thông tin user từ Google API bằng access_token
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const userInfo = await userInfoRes.json();
        // Gửi thông tin lên backend SmartParking
        await processOAuth2Login("google", userInfo.email, userInfo.name);
      } catch (err) {
        setError("Không thể lấy thông tin từ Google. Vui lòng thử lại.");
        setLoading(false);
      }
    },
    onError: () => {
      setError("Đăng nhập Google bị hủy hoặc thất bại.");
    },
  });

  // ========== FACEBOOK OAUTH ==========
  const handleFacebookLogin = useCallback(() => {
    if (!window.FB) {
      setError("Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau vài giây.");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const { accessToken } = response.authResponse;
          // Lấy thông tin user từ Facebook Graph API
          window.FB.api(
            "/me",
            { fields: "id,name,email", access_token: accessToken },
            async (fbUser) => {
              if (fbUser.email) {
                await processOAuth2Login("facebook", fbUser.email, fbUser.name);
              } else {
                setError(
                  "Không lấy được email từ Facebook. Vui lòng cấp quyền email khi đăng nhập."
                );
              }
            }
          );
        } else {
          setError("Đăng nhập Facebook bị hủy.");
        }
      },
      { scope: "email,public_profile" }
    );
  }, [processOAuth2Login]);

  // Load Facebook SDK
  useEffect(() => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!fbAppId || document.getElementById("facebook-jssdk")) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: fbAppId,
        cookie: true,
        xfbml: false,
        version: "v19.0",
      });
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/vi_VN/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    SLIDES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* ===== FULL LANDING REPLICA WRAPPER ===== */}
      <div ref={landingContainerRef} className="min-h-screen bg-[#030712] relative overflow-x-hidden font-sans text-slate-100">

        {/* Glow Spheres */}
        <div className="absolute top-[30vh] left-[-18vw] w-[46vw] h-[46vw] rounded-full bg-emerald-500/5 blur-[96px] pointer-events-none" />
        <div className="absolute top-[120vh] right-[-10vw] w-[38vw] h-[38vw] rounded-full bg-blue-500/5 blur-[88px] pointer-events-none" />
        <div className="absolute top-[210vh] left-[15vw] w-[40vw] h-[40vw] rounded-full bg-green-500/5 blur-[96px] pointer-events-none" />

        {/* ===== NAVIGATION (EVCare Style) ===== */}
        <nav
          style={{
            position: "fixed",
            top: isScrolled ? "16px" : "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: "1200px",
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 32px",
            background: "rgba(3, 7, 18, 0.4)",
            backdropFilter: "blur(16px)",
            borderRadius: "9999px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.5)",
            animation: "slideDown 0.6s ease-out",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg, #00ff87, #00b359)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "17px",
                fontWeight: "900",
                color: "#030712",
                boxShadow: "0 4px 20px rgba(0,255,135,0.3)",
              }}
            >
              P
            </div>
            <span
              style={{
                fontSize: "17px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              SmartParking
            </span>
          </div>

          {/* Navigation Anchors */}
          <div className="hidden md:flex items-center gap-2">
            <a href="#home" className="nav-link">Trang chủ</a>
            <a href="#about" className="nav-link">Quy trình</a>
            <a href="#services" className="nav-link">Dịch vụ</a>
            <a href="#pricing" className="nav-link">Bảng giá</a>
            <a href="#testimonials" className="nav-link">Khách hàng</a>
            <a href="#contact" className="nav-link">Liên hệ</a>
          </div>

          {/* Login Action CTA */}
          <button
            onClick={() => setShowLogin(true)}
            className="hero-btn"
            style={{
              background: isScrolled ? "rgba(0, 255, 135, 0.08)" : "rgba(255, 255, 255, 0.05)",
              color: "#00ff87",
              border: isScrolled ? "1px solid rgba(0, 255, 135, 0.25)" : "1px solid rgba(255, 255, 255, 0.15)",
              padding: "10px 24px",
              fontSize: "14px",
              borderRadius: "9999px",
              backdropFilter: isScrolled ? "none" : "blur(10px)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#00ff87";
              e.currentTarget.style.color = "#030712";
              e.currentTarget.style.borderColor = "#00ff87";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isScrolled ? "rgba(0, 255, 135, 0.08)" : "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.color = "#00ff87";
              e.currentTarget.style.borderColor = isScrolled ? "rgba(0, 255, 135, 0.25)" : "rgba(255, 255, 255, 0.15)";
            }}
          >
            Đăng Nhập
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
          </button>
        </nav>

        {/* ===== HERO SECTION (EVCare Match) ===== */}
        <section id="home" className="relative min-h-screen flex items-center justify-center pt-24">
          {/* Animated Parking Slide Background - GPU Optimized Continuous Ken Burns Transition */}
          {SLIDES.map((url, i) => (
            <div
              key={i}
              className="slide-img"
              style={{
                backgroundImage: `url('${url}')`,
                opacity: currentSlide === i ? 0.72 : 0,
                transition: "opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}

          {/* Hidden parallel image preloader container for zero-flash transitions */}
          <div style={{ display: "none" }}>
            {SLIDES.map((url, i) => (
              <img key={i} src={url} alt="preload" />
            ))}
          </div>

          {/* Deep futuristic dark gradient mesh - softer top for slide visibility, dark transition bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-[#030712] z-1" />

          {/* Hero text content */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400 hero-orb" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400 hero-orb" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-[#00ff87] bg-emerald-950/40 border border-emerald-500/20 mb-8 uppercase animate-pulse">
              BÃI ĐỖ THÔNG MINH • QR GATE • AI CAMERA
            </span>

            <h1 className="hero-title-gsap text-glow font-black leading-[1.02] tracking-tight uppercase" style={{ fontSize: "clamp(38px, 6.4vw, 88px)" }}>
              Smart Parking
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-lime-300 to-cyan-300">
                không chờ đợi
              </span>
            </h1>

            <p className="hero-desc-gsap mt-6 text-slate-300/90 max-w-3xl text-sm md:text-lg leading-relaxed">
              Nền tảng quản lý bãi xe cá nhân với đặt chỗ trước, QR check-in/check-out, giám sát camera và dashboard vận hành thời gian thực cho tài xế, nhân viên, quản lý và quản trị viên.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-2xl">
              {[
                { value: "45s", label: "Ra vào trung bình" },
                { value: "99.8%", label: "Check-in thành công" },
                { value: "24/7", label: "Giám sát vận hành" },
              ].map((item) => (
                <div key={item.label} className="hero-metric-gsap metric-pill rounded-2xl px-4 py-3 text-center">
                  <p className="text-lg md:text-2xl font-black text-white">{item.value}</p>
                  <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* CTA Actions */}
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setShowLogin(true)}
                className="hero-btn-gsap hero-btn"
                style={{
                  background: "linear-gradient(135deg, #00ff87, #00b359)",
                  color: "#030712",
                  boxShadow: "0 8px 30px rgba(0, 255, 135, 0.35)",
                }}
              >
                Truy cập hệ thống
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <a
                href="#about"
                className="hero-btn-gsap hero-btn"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)"; }}
              >
                Khám phá quy trình
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ===== STATS & TRUST SECTION (Premium SaaS) ===== */}
        <section className="trust-panel-gsap relative z-10 -mt-16 mb-24 px-5 md:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#070b12] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative p-6 md:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.6fr] lg:items-end">
                <div className="max-w-md">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.7)]" />
                    Live operating layer
                  </div>
                  <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                    Vận hành bãi xe theo zone, rõ ràng từng lớp dữ liệu.
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    SmartParking v2 tập trung vào sức chứa theo khu/tầng, trạng thái vào ra và dữ liệu vận hành đáng tin cậy cho tài xế lẫn ban quản lý.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { val: "99.8%", label: "Phiên gửi xe xác thực", trend: "+2.4%", tone: "emerald" },
                    { val: "45s", label: "Thời gian qua cổng TB", trend: "-18%", tone: "sky" },
                    { val: "15+", label: "Zone đang vận hành", trend: "active", tone: "slate" },
                    { val: "18k+", label: "Lượt gửi mỗi tháng", trend: "+12%", tone: "emerald" },
                  ].map((stat, idx) => (
                    <div
                      key={stat.label}
                      className={`group rounded-3xl border border-white/[0.075] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.055] ${idx === 1 ? "xl:mt-8" : idx === 2 ? "xl:-mt-4" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Metric 0{idx + 1}</span>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${stat.tone === "emerald" ? "bg-emerald-400/10 text-emerald-200" : stat.tone === "sky" ? "bg-sky-400/10 text-sky-200" : "bg-white/10 text-slate-300"}`}>
                          {stat.trend}
                        </span>
                      </div>
                      <p className="mt-6 text-4xl font-black tracking-[-0.055em] text-white md:text-[2.65rem]">{stat.val}</p>
                      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-400">{stat.label}</p>
                      <div className="mt-6 h-px bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 grid gap-4 border-t border-white/[0.07] pt-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-white/[0.07] bg-black/20 p-5 md:p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Realtime capacity stream</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <StatusPill color="emerald" label={`${activeVehicles} xe đang gửi`} />
                        <StatusPill color="sky" label="Zone counters synced" />
                        <StatusPill color="amber" label="QR gate verified" />
                      </div>
                    </div>
                    <div className="min-w-44 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sức chứa khả dụng</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-white">124</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-300/[0.12] bg-amber-300/[0.055] p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-[10px] font-black tracking-widest text-amber-100">OK</span>
                    <div>
                      <p className="text-sm font-bold text-amber-100">Cam kết vận hành minh bạch</p>
                      <p className="mt-2 text-xs leading-6 text-amber-100/65">
                        Ghi nhận reservation, session, lượt vào/ra và sự cố theo zone để đối soát rõ ràng giữa tài xế, staff và quản lý.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== INTERACTIVE STEPPER (Quy Trình 4 Bước EVCare Style) ===== */}
        < section id="about" className="py-24 section-glow-green relative overflow-hidden" >
          {/* Decorative orb */}
          < div className="section-orb w-[500px] h-[500px] bg-emerald-500 top-1/4 -left-40" />
          <div className="section-orb w-[400px] h-[400px] bg-cyan-500 bottom-0 right-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="stepper-header-gsap text-center mb-16">
              <span className="text-xs font-bold text-[#00ff87] tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Cách thức hoạt động
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-4">
                QUY TRÌNH ĐẶT CHỖ & VÀO BÃI
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mt-4 text-sm md:text-base">
                Đặt chỗ đỗ xe trực tuyến siêu tốc chỉ trong 4 bước đơn giản, giúp bạn chủ động vị trí và an tâm đỗ xe.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Steps list */}
              <div className="lg:col-span-6 space-y-4">
                {[
                  {
                    step: "01",
                    title: "Đăng ký phương tiện đỗ",
                    desc: "Đăng nhập với vai trò Tài xế, nhập chính xác Biển số xe và loại xe (Xe máy, Ô tô, Xe điện) để hệ thống nhận diện."
                  },
                  {
                    step: "02",
                    title: "Chọn Zone đỗ trống khả dụng",
                    desc: "Xem bản đồ sức chứa thực tế và lựa chọn khu vực mong muốn (Ví dụ: Zone hầm B1 cho xe máy, Tầng 1 cho xe ô tô)."
                  },
                  {
                    step: "03",
                    title: "Đồng ý Booking & Nhận vé QR",
                    desc: "Xác nhận lịch trình đến đỗ, hệ thống tiến hành khóa chỗ trống bảo đảm trên Redis và cấp mã QR Code bảo mật."
                  },
                  {
                    step: "04",
                    title: "Quét QR để mở cổng & đỗ xe",
                    desc: "Khi đến, quét mã QR tại barrier. Cổng chính mở ra, dẫn xe vào đúng Zone, counter tự động ghi nhận xe đã vào chỗ đỗ."
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`stepper-item-gsap p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${activeStep === idx
                      ? "bg-slate-900/80 border-[#00ff87]/30 shadow-lg shadow-emerald-500/5"
                      : "bg-slate-950/20 border-white/5 hover:bg-slate-900/30"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${activeStep === idx ? "bg-[#00ff87] text-[#030712]" : "bg-slate-800 text-slate-400"
                        }`}>
                        {item.step}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-base md:text-lg">{item.title}</h3>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Live security CCTV AI video loop under steps */}
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 overflow-hidden relative flex flex-col md:flex-row items-center gap-6 glass-card animate-fadeIn">
                  <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden border border-white/10 relative shrink-0">
                    <video
                      src={cctvVid}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    <div className="scanline" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-[10px] font-black text-[#00ff87] tracking-widest uppercase flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      AI CCTV CAMERA PORTAL
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">Hệ thống Camera AI Quét Biển Số Tự Động</h4>
                    <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Nhận diện chính xác biển số xe ra vào và đồng bộ trạng thái đóng mở cổng tự động, đảm bảo an ninh tối đa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Interactive Mockup */}
              <div className="stepper-mockup-gsap lg:col-span-6 flex justify-center">
                <div className="w-full max-w-[380px] aspect-[9/18] rounded-[48px] bg-slate-950 p-4 border-[6px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden">
                  {/* Speaker/Camera notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-slate-800 z-20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                    <div className="w-10 h-1 bg-slate-900 rounded-full" />
                  </div>

                  {/* Simulated Screen Inner */}
                  <div className="flex-1 rounded-[38px] bg-[#070b13] p-5 pt-8 flex flex-col justify-between relative overflow-hidden">

                    {/* Mock status bar */}
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mb-4 z-10">
                      <span>SmartParking App</span>
                      <span className="flex items-center gap-1">5G · 100%</span>
                    </div>

                    {/* Sliding Steps Container */}
                    <div className="flex-1 relative overflow-hidden flex flex-col justify-center">
                      <div
                        className="flex-1 flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                        style={{
                          width: "400%",
                          transform: `translateX(-${activeStep * 25}%)`,
                          willChange: "transform",
                        }}
                      >
                        {/* STEP 1 SCREEN */}
                        <div className="w-1/4 h-full flex flex-col justify-center px-1" style={{ flexShrink: 0 }}>
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-[11px] font-black tracking-widest text-emerald-300">CAR</div>
                          <h4 className="text-center font-bold text-white text-sm">Đăng ký Xe Gửi</h4>
                          <p className="text-center text-[10px] text-slate-500 mt-1 mb-4">Nhập thông tin biển số và phân loại xe</p>

                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 text-left">
                              <label className="block text-[8px] font-bold uppercase text-slate-500 mb-1">Loại Phương Tiện</label>
                              <span className="text-[11px] font-bold text-white">Xe ô tô 4 chỗ</span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 text-left">
                              <label className="block text-[8px] font-bold uppercase text-slate-500 mb-1">Biển Số Xe</label>
                              <span className="text-[11px] font-bold text-emerald-400 font-mono">30A-999.88</span>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 text-left">
                              <label className="block text-[8px] font-bold uppercase text-slate-500 mb-1">Mã Tài Xế (Driver ID)</label>
                              <span className="text-[11px] font-bold text-slate-300">#DRV-18247</span>
                            </div>
                          </div>
                        </div>

                        {/* STEP 2 SCREEN */}
                        <div className="w-1/4 h-full flex flex-col justify-center px-1" style={{ flexShrink: 0 }}>
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-[11px] font-black tracking-widest text-blue-300">MAP</div>
                          <h4 className="text-center font-bold text-white text-sm">Chọn Zone Trống</h4>
                          <p className="text-center text-[10px] text-slate-500 mt-1 mb-4">Redis Real-time Capacity</p>

                          <div className="space-y-2">
                            {[
                              { name: "Zone B1-A (Tầng B1)", cap: "48/60 Xe máy", active: false },
                              { name: "Zone T1-A (Tầng 1)", cap: "14/30 Ô tô", active: true },
                              { name: "Zone T2-A (Tầng 2)", cap: "08/20 Xe điện", active: false }
                            ].map((zone, i) => (
                              <div key={i} className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${zone.active ? "bg-emerald-950/20 border-emerald-500/30" : "bg-slate-900 border-white/5"
                                }`}>
                                <div>
                                  <p className="text-[10px] font-bold text-white">{zone.name}</p>
                                  <p className="text-[8px] text-slate-500 mt-0.5">{zone.cap}</p>
                                </div>
                                {zone.active && <span className="text-[9px] font-black text-[#00ff87]">CHỈ ĐỊNH</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* STEP 3 SCREEN */}
                        <div className="w-1/4 h-full flex flex-col justify-center px-1" style={{ flexShrink: 0 }}>
                          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3 text-[11px] font-black tracking-widest text-cyan-300">QR</div>
                          <h4 className="text-center font-bold text-white text-sm">Vé Đỗ Xe QR Code</h4>
                          <p className="text-center text-[9px] text-slate-500 mt-0.5 mb-3">Booking Code: SPX-18247</p>

                          <div className="rounded-xl border border-white/5 bg-slate-900 p-3 relative overflow-hidden flex flex-col items-center">
                            <div className="scanline" />
                            <div className="w-20 h-20 bg-white p-1.5 rounded-lg mb-2 shadow-md relative">
                              <img
                                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SmartParking_SPX-18247"
                                alt="Vé QR đỗ xe"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="font-mono text-[8px] font-bold text-slate-400">QUÉT QR TẠI CỔNG VÀO</span>
                          </div>
                        </div>

                        {/* STEP 4 SCREEN */}
                        <div className="w-1/4 h-full flex flex-col justify-center items-center px-1" style={{ flexShrink: 0 }}>
                          <div className="w-16 h-16 rounded-full bg-emerald-500/25 border-2 border-[#00ff87] flex items-center justify-center mb-4 animate-bounce">
                            <span className="h-3 w-3 rounded-full bg-[#00ff87] shadow-[0_0_20px_rgba(0,255,135,0.75)]" />
                          </div>
                          <h4 className="font-black text-white text-center text-sm uppercase tracking-wide">Cổng Đã Mở!</h4>
                          <p className="text-center text-[10px] text-slate-400 px-2 mt-1 leading-normal">
                            Xác nhận quét mã vé QR thành công.<br />Xin mời xe đi vào <strong className="text-emerald-400">Zone T1-A</strong>.
                          </p>

                          <div className="mt-5 px-3 py-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
                            COUNTER: ZONE T1-A + 1 XE
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back/Home Bar */}
                    <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mt-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section >

        {/* ===== MARQUEE HORIZONTAL SERVICES LOOP (EVCare Style) ===== */}
        < section id="services" className="py-24 section-glow-blue relative overflow-hidden" >
          <div className="section-orb w-[600px] h-[600px] bg-blue-600 top-1/3 left-1/4" />
          <div className="section-orb w-[300px] h-[300px] bg-indigo-500 top-0 right-20" />

          <div className="services-header-gsap text-center mb-16">
            <span className="text-xs font-bold text-[#00ff87] tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Danh mục tiện ích
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-4">
              DỊCH VỤ CÔNG NGHỆ BÃI ĐỖ
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-4 text-sm md:text-base">
              Khám phá hệ thống 10 module công nghệ tiên tiến đang trực tiếp vận hành tại SmartParking v2.
            </p>
          </div>

          {/* Marquee Row Container */}
          <div className="relative w-full flex overflow-x-hidden py-4 mask-gradient">
            <div className="animate-marquee flex gap-6">
              {[
                { code: "MOTO", title: "Gửi Xe Máy Tiện Lợi", desc: "Không cần ghi phấn vẽ thẻ" },
                { code: "AUTO", title: "Đỗ Ô Tô An Toàn", desc: "Không lo va quệt trầy xước" },
                { code: "EV", title: "Trạm Sạc EV Sẵn Sàng", desc: "Đỗ xe tích hợp sạc nhanh" },
                { code: "QR", title: "In Vé QR Tức Thì", desc: "Mã hóa bảo mật chống thất lạc" },
                { code: "REDIS", title: "Redis Counter Chống Trùng", desc: "Bảo đảm chỗ trống khả dụng" },
                { code: "SEC", title: "Giám Sát An Ninh 24/7", desc: "Camera lưu vết Exception Logs" },
                { code: "LPR", title: "Camera AI Quét Biển Số", desc: "Nhận dạng tự động trong 1s" },
                { code: "PAY", title: "Thanh Toán Không Tiền Mặt", desc: "QR Momo/VNPAY cực kỳ nhanh" },
                { code: "BOOK", title: "Đặt Chỗ Trước Linh Hoạt", desc: "Nhận đề xuất zone trống tối ưu" },
                { code: "GATE", title: "Cổng Zone Real-time", desc: "Đồng bộ counter 2 lớp cổng" }
              ].map((item, idx) => (
                <div key={idx} className="w-[280px] p-6 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between shrink-0 glass-card">
                  <div>
                    <span className="mb-3 inline-flex h-9 min-w-14 items-center justify-center rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 text-[10px] font-black tracking-widest text-emerald-300">{item.code}</span>
                    <h3 className="font-extrabold text-white text-sm mb-1 uppercase tracking-wide">{item.title}</h3>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-[9px] font-black text-emerald-400 tracking-widest mt-4 uppercase">ACTIVE MODULE</span>
                </div>
              ))}
            </div>

            {/* Loop duplication for infinite effect */}
            <div className="animate-marquee flex gap-6" aria-hidden="true">
              {[
                { code: "MOTO", title: "Gửi Xe Máy Tiện Lợi", desc: "Không cần ghi phấn vẽ thẻ" },
                { code: "AUTO", title: "Đỗ Ô Tô An Toàn", desc: "Không lo va quệt trầy xước" },
                { code: "EV", title: "Trạm Sạc EV Sẵn Sàng", desc: "Đỗ xe tích hợp sạc nhanh" },
                { code: "QR", title: "In Vé QR Tức Thì", desc: "Mã hóa bảo mật chống thất lạc" },
                { code: "REDIS", title: "Redis Counter Chống Trùng", desc: "Bảo đảm chỗ trống khả dụng" },
                { code: "SEC", title: "Giám Sát An Ninh 24/7", desc: "Camera lưu vết Exception Logs" },
                { code: "LPR", title: "Camera AI Quét Biển Số", desc: "Nhận dạng tự động trong 1s" },
                { code: "PAY", title: "Thanh Toán Không Tiền Mặt", desc: "QR Momo/VNPAY cực kỳ nhanh" },
                { code: "BOOK", title: "Đặt Chỗ Trước Linh Hoạt", desc: "Nhận đề xuất zone trống tối ưu" },
                { code: "GATE", title: "Cổng Zone Real-time", desc: "Đồng bộ counter 2 lớp cổng" }
              ].map((item, idx) => (
                <div key={idx + 10} className="w-[280px] p-6 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col justify-between shrink-0 glass-card">
                  <div>
                    <span className="mb-3 inline-flex h-9 min-w-14 items-center justify-center rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 text-[10px] font-black tracking-widest text-emerald-300">{item.code}</span>
                    <h3 className="font-extrabold text-white text-sm mb-1 uppercase tracking-wide">{item.title}</h3>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <span className="text-[9px] font-black text-emerald-400 tracking-widest mt-4 uppercase">ACTIVE MODULE</span>
                </div>
              ))}
            </div>
          </div>

          {/* Operations Live Showcase Video */}
          <div className="services-showcase-gsap max-w-7xl mx-auto px-6 mt-16 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center media-card p-8">
              <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-video border border-white/10 relative">
                <video
                  src={parkingVid}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="lg:col-span-5 text-left space-y-4">
                <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full">
                  DỊCH VỤ NỔI BẬT KHUYÊN DÙNG
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  TRUNG TÂM VẬN HÀNH BÃI XE THỜI GIAN THỰC
                </h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Nhân viên theo dõi lượt vào/ra, sức chứa từng zone, phiên gửi xe và trạng thái thanh toán ngay trên dashboard. Video nền giúp landing page có cảm giác công nghệ, hiện đại và đáng tin cậy hơn.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-center flex-1">
                    <p className="text-emerald-400 font-extrabold text-lg">Real-time</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Cập nhật sức chứa</p>
                  </div>
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 text-center flex-1">
                    <p className="text-blue-400 font-extrabold text-lg">5 Vai trò</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Driver / Staff / Security / Manager / Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section >

        {/* ===== LIVE PRICING & AVAILABILITY SECTION ===== */}
        <section id="pricing" className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
          <div className="section-orb w-[500px] h-[500px] bg-cyan-600 top-1/4 -right-40" />
          <div className="section-orb w-[350px] h-[350px] bg-emerald-500 bottom-20 left-10" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-[#00ff87] tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Thông tin công khai
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-6 mb-4">
                Sức Chứa & <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Bảng Giá</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                Theo dõi sức chứa theo thời gian thực và xem bảng giá gửi xe trước khi tới — không cần đăng nhập.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: Live Availability */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-[11px] font-black tracking-widest text-slate-950">CAP</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Sức chứa thời gian thực</h3>
                    <p className="text-xs text-slate-500">
                      {publicInfo?.building?.name || "Smart Parking"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Live</span>
                  </div>
                </div>

                {publicInfo?.availability ? (
                  <>
                    {/* Total summary bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Tổng sức chứa</span>
                        <span className="text-white font-bold">
                          {publicInfo.availability.totalOccupied + publicInfo.availability.totalReserved} / {publicInfo.availability.totalCapacity} xe
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.round(((publicInfo.availability.totalOccupied + publicInfo.availability.totalReserved) / Math.max(publicInfo.availability.totalCapacity, 1)) * 100)}%`,
                            background: 'linear-gradient(90deg, #10b981, #06b6d4)'
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-emerald-400 font-semibold">{publicInfo.availability.totalAvailable} chỗ trống</span>
                        <span className="text-xs text-amber-400 font-semibold">{publicInfo.availability.totalReserved} đã giữ chỗ</span>
                      </div>
                    </div>

                    {/* Per-floor breakdown */}
                    <div className="space-y-3">
                      {Object.entries(publicInfo.availability.floors || {}).map(([floorName, data]) => {
                        const pct = Math.round(((data.occupied + data.reserved) / Math.max(data.capacity, 1)) * 100);
                        const statusColor = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400';
                        const statusLabel = pct >= 90 ? 'Gần đầy' : pct >= 70 ? 'Đông' : 'Còn trống';
                        const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
                        const labelMap = { 'B1': 'Hầm B1', 'B2': 'Hầm B2', 'G': 'Tầng G', 'T1': 'Tầng 1' };
                        return (
                          <div key={floorName} className="rounded-xl bg-slate-800/60 border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white text-sm">{labelMap[floorName] || floorName}</span>
                              <span className={`text-xs font-bold ${statusColor}`}>{statusLabel} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[11px] text-slate-500">
                              <span>{data.occupied} đang gửi</span>
                              <span>{data.reserved} giữ chỗ</span>
                              <span>{data.available} trống</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="h-10 w-10 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin mb-4" />
                    <p className="text-sm">Đang tải dữ liệu sức chứa...</p>
                  </div>
                )}
              </div>

              {/* RIGHT: Pricing Table */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-[11px] font-black tracking-widest text-slate-950">FEE</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Bảng giá gửi xe</h3>
                    <p className="text-xs text-slate-500">
                      {publicInfo?.building?.address || "Áp dụng tại tòa nhà"}
                    </p>
                  </div>
                </div>

                {publicInfo?.pricing && publicInfo.pricing.length > 0 ? (
                  <div className="space-y-3">
                    {/* Group by vehicle type */}
                    {[...new Set(publicInfo.pricing.map(p => p.vehicleType))].map(vType => {
                      const rules = publicInfo.pricing.filter(p => p.vehicleType === vType);
                      const vLower = vType.toLowerCase();
                      const code = vLower.includes('máy') ? 'MOTO' : vLower.includes('đạp') ? 'BIKE' : vLower.includes('tải') ? 'TRUCK' : 'AUTO';
                      return (
                        <div key={vType} className="rounded-xl bg-slate-800/60 border border-white/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black tracking-widest text-slate-300">{code}</span>
                            <span className="font-bold text-white text-sm">{vType}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {rules.map((r, i) => {
                              const typeLabels = { HOURLY: 'Theo giờ', DAILY: 'Theo ngày', MONTHLY: 'Theo tháng' };
                              const typeColors = { HOURLY: 'from-cyan-500 to-blue-500', DAILY: 'from-emerald-500 to-teal-500', MONTHLY: 'from-purple-500 to-pink-500' };
                              return (
                                <div key={i} className="rounded-lg bg-slate-900/80 border border-white/5 p-3 text-center">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{typeLabels[r.pricingType] || r.pricingType}</p>
                                  <p className={`text-lg font-black bg-gradient-to-r ${typeColors[r.pricingType] || 'from-white to-slate-300'} bg-clip-text text-transparent`}>
                                    {Number(r.pricePerUnit).toLocaleString('vi-VN')}đ
                                  </p>
                                  {r.freeMinutes > 0 && (
                                    <p className="text-[10px] text-emerald-400 mt-1">Miễn phí {r.freeMinutes} phút đầu</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Operating hours */}
                    {publicInfo?.building && (

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                        </div>
                      </div>

                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="h-10 w-10 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin mb-4" />
                    <p className="text-sm">Đang tải bảng giá...</p>
                  </div>
                )}
              </div>
            </div>


          </div>
        </section>

        {/* ===== TESTIMONIALS SECTION (EVCare Style) ===== */}
        < section id="testimonials" className="py-24 section-glow-purple relative overflow-hidden" >
          <div className="section-orb w-[500px] h-[500px] bg-purple-600 top-1/3 right-1/4" />
          <div className="section-orb w-[350px] h-[350px] bg-pink-500 bottom-10 left-10" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="testimonials-header-gsap text-center mb-16">
              <span className="text-xs font-bold text-[#00ff87] tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Nhận xét thực tế
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-4">
                ĐÁNH GIÁ TỪ CHỦ PHƯƠNG TIỆN
              </h2>
              <div className="flex justify-center items-center gap-2 mt-4 text-[#00ff87]">
                <span className="text-lg font-black tracking-tight">4.9/5.0</span>
                <span className="text-slate-400 text-xs">dựa trên hơn 18,247 lượt bình chọn 5 sao</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Thật sự tuyệt vời! Tôi lái chiếc VinFast VF8 và luôn lo lắng về trạm sạc khi gửi xe. Bãi đỗ SmartParking v2 đề xuất ngay Zone T2-A có trạm sạc thông minh. Việc đặt chỗ trước giúp tôi siêu yên tâm.",
                  author: "Anh Hoàng Bách",
                  role: "Chủ xe VinFast VF8 - Đỗ xe Zone T2-A"
                },
                {
                  quote: "Trước kia mỗi lần đi làm qua tòa nhà tôi mất đến 15 phút chỉ để vòng hầm tìm chỗ đỗ xe máy. Giờ đây nhờ hệ thống gợi ý Zone B1-A còn trống và counter Redis cập nhật thời gian thực, tôi chỉ cần 30 giây để gửi xe.",
                  author: "Chị Minh Thư",
                  role: "Nhân viên văn phòng - Đỗ xe máy Zone B1-A"
                },
                {
                  quote: "Dịch vụ vé tháng ở đây quá tiện lợi. Camera AI nhận dạng biển số cực kỳ nhạy, chỉ mất 1 giây để barrier mở không cần quét thẻ vật lý. Tôi đánh giá 5 sao cho giải pháp không chạm của hệ thống.",
                  author: "Anh Quốc Bảo",
                  role: "Chủ xe Tesla Model Y - Thành viên Monthly Pass"
                }
              ].map((tst, idx) => (
                <div key={idx} className="testimonial-card-gsap p-8 rounded-3xl bg-[#EBE5DF] text-left flex flex-col justify-between shadow-2xl hover:scale-[1.03] transition-all duration-300">
                  <div>
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-amber-500 text-[10px] font-black tracking-[0.18em]">RATING 5.0</span>
                      <span className="text-slate-600 text-[10px] font-bold ml-1">(5/5)</span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed italic mb-6">"{tst.quote}"</p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{tst.author}</h4>
                    <p className="text-[10px] text-emerald-800 font-bold mt-1 uppercase tracking-wider">{tst.role}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial Video Hero Card */}
            <div className="testimonial-showcase-gsap mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/40 border border-white/5 p-8 rounded-3xl glass-card text-left animate-fadeIn">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">
                  TRẢI NGHIỆM ĐỒNG HÀNH
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  HÀNH TRÌNH KHÔNG CÒN ÁP LỰC ĐỖ XE
                </h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                  Chúng tôi hiểu rằng việc tìm chỗ đỗ xe có thể làm hỏng toàn bộ tâm trạng của một ngày làm việc. SmartParking sinh ra để giải phóng bạn khỏi áp lực đó. Đặt lịch trước, lái xe vào bãi không chạm, và an tâm tận hưởng hành trình!
                </p>
                <div className="pt-2">
                  <p className="text-xs font-bold text-white flex items-center gap-2">
                    <strong className="text-emerald-400">98.5%</strong> Khách hàng phản hồi cảm thấy thoải mái hơn khi sử dụng app của chúng tôi.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-video border border-white/10 relative">
                <video
                  src={driveVid}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
              </div>
            </div>
          </div>
        </section >

        {/* ===== CONTACT FORM & MAPS SECTION (EVCare Style) ===== */}
        < section id="contact" className="py-24 section-glow-amber relative overflow-hidden" >
          <div className="section-orb w-[500px] h-[500px] bg-amber-500 top-1/4 left-1/3" />
          <div className="section-orb w-[300px] h-[300px] bg-orange-400 bottom-20 right-10" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="contact-header-gsap text-center mb-16">
              <span className="text-xs font-bold text-[#00ff87] tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Liên hệ chúng tôi
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-4">
                ĐẶT LỊCH / LIÊN HỆ BAN QUẢN TRỊ
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mt-4 text-sm md:text-base">
                Mọi thắc mắc về kỹ thuật, đăng ký thẻ tháng hoặc giải quyết sự cố, xin vui lòng gửi tin nhắn hoặc gọi Hotline hỗ trợ.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Contacts info */}
              <div className="contact-info-gsap lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex gap-4 text-left glass-card">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.5)]" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">Trụ Sở Bãi Xe</h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                      Khu Công nghệ cao Hòa Lạc, Km 29 Đại lộ Thăng Long, Thạch Thất, Hà Nội.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex gap-4 text-left glass-card">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.5)]" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">Hotline Kỹ Thuật 24/7</h3>
                    <p className="text-[#00ff87] font-mono text-sm font-black mt-1">+84 (24) 7300-1866</p>
                    <p className="text-slate-500 text-[9px] mt-0.5">Tiếp nhận giải quyết sự cố an ninh & sự cố thẻ</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex gap-4 text-left glass-card">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.5)]" />
                  <div>
                    <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">Thời Gian Vận Hành</h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                      Hoạt động toàn thời gian (24/7/365) kể cả các ngày lễ Tết.
                    </p>
                  </div>
                </div>

                {/* Live Connected Smart City Infrastructure video loop */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 overflow-hidden glass-card relative animate-fadeIn">
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                    <video
                      src={cityVid}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#00ff87]/5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 mt-3 text-left flex items-center gap-1.5 justify-center uppercase">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    BẢN ĐỒ KẾT NỐI SMART CITY REAL-TIME
                  </p>
                </div>
              </div>

              {/* Right Message Form */}
              <div className="contact-form-gsap lg:col-span-7 p-8 rounded-2xl bg-slate-900/60 border border-white/5 glass-card">
                <h3 className="font-bold text-white text-lg mb-6 text-left">Gửi Tin Nhắn Phản Hồi Dịch Vụ</h3>

                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase text-left">Tên của bạn</label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        required
                        className="modal-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase text-left">Email liên hệ</label>
                      <input
                        type="email"
                        placeholder="a.nguyen@email.com"
                        required
                        className="modal-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase text-left">Nội dung câu hỏi</label>
                    <textarea
                      rows="4"
                      placeholder="Hãy cho chúng tôi biết thắc mắc của bạn về việc đăng ký vé tháng, sự cố thẻ hay bất kỳ ý kiến đóng góp nào..."
                      required
                      className="modal-input"
                      style={{ height: "120px", padding: "12px 18px", resize: "none" }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => alert("Cảm ơn đóng góp của bạn! Hệ thống đã ghi nhận thành công phản hồi.")}
                    className="submit-btn"
                  >
                    Gửi Phản Hồi Ngay
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section >

        {/* ===== PREMIUM ENTERPRISE FOOTER ===== */}
        <footer className="relative z-10 overflow-hidden border-t border-white/[0.08] bg-[#050812]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-emerald-400/[0.06] blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-sky-400/[0.045] blur-3xl" />

          <div className="relative mx-auto w-full px-6 py-16 md:px-10 md:py-20 xl:px-16 2xl:px-20">
            <div className="mb-14 grid gap-6 rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:grid-cols-[1.2fr_0.8fr] md:p-8">
              <div className="max-w-2xl text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">Về ParkingSystem</p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.035em] text-white md:text-4xl">
                  Giải pháp bãi đỗ xe thông minh cho vận hành hiện đại.
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  ParkingSystem hỗ trợ tài xế đặt chỗ, quét QR ra vào, theo dõi sức chứa theo khu vực và giúp nhân viên quản lý phiên gửi xe minh bạch hơn mỗi ngày.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 text-left">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Nhận cập nhật sản phẩm</p>
                <p className="mt-2 text-sm text-slate-300">Thông báo phiên bản mới, module vận hành và cải tiến dashboard.</p>
                <div className="mt-5 flex rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 focus-within:border-emerald-300/30">
                  <input
                    type="email"
                    placeholder="email@company.com"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => alert("Cảm ơn bạn đã đăng ký nhận bản tin công nghệ của chúng tôi!")}
                    className="rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950 transition-all duration-300 hover:bg-emerald-200 active:scale-[0.98]"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-12 border-b border-white/[0.07] pb-14 text-left md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-base font-black text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.22)]">
                    S
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight text-white">SmartParking Personal</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Zone capacity system</p>
                  </div>
                </div>
                <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
                  Giải pháp quản lý bãi đỗ xe thông minh theo mô hình zone/floor capacity, hỗ trợ reservation, parking session, QR ticket và đối soát vận hành.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["CAPACITY", "SESSION", "QR GATE", "REPORTING"].map((item) => (
                    <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-slate-400">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <FooterColumn
                title="Sản phẩm"
                links={[
                  { label: "Quy trình đặt zone", href: "#about" },
                  { label: "Sơ đồ sức chứa", href: "#pricing" },
                  { label: "Camera & QR gate", href: "#services" },
                  { label: "Bảng giá công khai", href: "#pricing" },
                ]}
              />

              <FooterColumn
                title="Cổng truy cập"
                links={[
                  { label: "Driver portal", action: () => { setShowLogin(true); setIsSignUp(false); } },
                  { label: "Staff dashboard", action: () => { setShowLogin(true); setIsSignUp(false); } },
                  { label: "Manager analytics", action: () => { setShowLogin(true); setIsSignUp(false); } },
                  { label: "Admin control", action: () => { setShowLogin(true); setIsSignUp(false); } },
                ]}
              />

              <div className="md:col-span-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Vận hành</h4>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-300/[0.12] bg-emerald-300/[0.055] p-4">
                    <div className="flex items-center gap-2 text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-[0.16em]">System online</span>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-emerald-100/65">Redis counters, reservation flow và QR validation đang sẵn sàng cho demo.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FooterMetric value="24/7" label="Vận hành" />
                    <FooterMetric value="v2" label="Zone model" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 pt-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <p>
                © {new Date().getFullYear()} <span className="font-semibold text-slate-300">SmartParking Personal</span>. Built for SU26SWP391 demonstration.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <a href="#" className="transition-colors hover:text-white">Điều khoản</a>
                <a href="#" className="transition-colors hover:text-white">Bảo mật</a>
                <a href="#contact" className="transition-colors hover:text-white">Liên hệ</a>
                <span className="text-slate-700">Xavalo Campus</span>
              </div>
            </div>
          </div>
        </footer>
      </div >

      {/* ===== LOGIN & REGISTER MODAL ===== */}
      {
        showLogin && (
          <div
            className="modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}
          >
            <div className="modal-card animate-scaleIn" style={{ maxWidth: "460px" }}>
              {/* Close button */}
              <button
                onClick={() => setShowLogin(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: "#9ca3af",
                  transition: "all 0.2s",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                ✕
              </button>

              {/* Logo and Header */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    margin: "0 auto 12px",
                    background: "linear-gradient(135deg, #00ff87, #00b359)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: "900",
                    color: "#030712",
                    boxShadow: "0 6px 20px rgba(0,255,135,0.3)",
                  }}
                >
                  P
                </div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    color: "#fff",
                  }}
                >
                  {isSignUp ? "Tạo Tài Khoản Mới" : "Chào Mừng Trở Lại"}
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  {isSignUp ? "Đăng ký thành viên lái xe SmartParking" : "Truy cập hệ thống SmartParking"}
                </p>
              </div>

              {/* Tab Selector Switcher */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  padding: "4px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                  style={{
                    padding: "10px 0",
                    fontSize: "13px",
                    fontWeight: "700",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: !isSignUp ? "rgba(0,255,135,0.12)" : "transparent",
                    color: !isSignUp ? "#00ff87" : "#9ca3af",
                    fontFamily: "inherit",
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                  style={{
                    padding: "10px 0",
                    fontSize: "13px",
                    fontWeight: "700",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: isSignUp ? "rgba(0,255,135,0.12)" : "transparent",
                    color: isSignUp ? "#00ff87" : "#9ca3af",
                    fontFamily: "inherit",
                  }}
                >
                  Đăng ký mới
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    fontSize: "13px",
                    color: "#f87171",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={isSignUp ? handleSignUp : handleLogin}>

                {/* Trường Họ tên chỉ khi đăng ký */}
                {isSignUp && (
                  <div style={{ marginBottom: "14px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#9ca3af",
                        marginBottom: "6px",
                      }}
                    >
                      Họ và tên của bạn
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="modal-input"
                    />
                  </div>
                )}

                <div style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Email đăng nhập hoặc Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="taixe@parking.vn hoặc 0912345678"
                    required
                    className="modal-input"
                  />
                </div>



                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="modal-input"
                  />
                </div>

                {/* Trường Xác nhận mật khẩu chỉ khi đăng ký */}
                {isSignUp && (
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#9ca3af",
                        marginBottom: "6px",
                      }}
                    >
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      required
                      className="modal-input"
                    />
                  </div>
                )}

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading
                    ? "Đang xác thực thông tin..."
                    : isSignUp
                      ? "Tạo Tài Khoản Ngay"
                      : "Xác nhận Đăng nhập"}
                </button>
              </form>

              {/* Social Authentication Options */}
              <div style={{ marginTop: "18px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}></div>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px" }}>Hoặc tiếp tục bằng</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      height: "44px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.03)",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.64l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>

                  {/* Facebook Button */}
                  <button
                    type="button"
                    onClick={() => handleFacebookLogin()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      height: "44px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.03)",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                  >
                    <svg width="18" height="18" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              {/* Demo Autocompletes (chỉ khi ở tab Đăng nhập) */}
              {!isSignUp && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#4b5563",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      marginBottom: "8px",
                    }}
                  >
                    Tài khoản dùng thử demo
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {[
                      { label: "Nhân viên (Staff)", email: "staff@parking.vn" },
                      { label: "Tài xế (Driver)", email: "driver@parking.vn" },
                      { label: "Bảo an (Security)", email: "security@parking.vn" },
                      { label: "Quản lý (Manager)", email: "manager@parking.vn" },
                      { label: "Quản trị (Admin)", email: "admin@parking.vn" },
                    ].map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setEmail(acc.email);
                          setPassword("123456");
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.05)",
                          background: "rgba(255,255,255,0.02)",
                          color: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(0, 255, 135, 0.4)";
                          e.currentTarget.style.background = "rgba(0, 255, 135, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {acc.label}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "10px",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          {acc.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Floating CTA Button (EVCare Style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 text-sm font-extrabold tracking-[-0.01em] shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-all duration-300 border border-emerald-300/20"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Đặt lịch chỗ đỗ ngay
        </button>
      </div>
    </>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className="md:col-span-2">
      <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-white">{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map((item) => (
          <li key={item.label}>
            {item.action ? (
              <button
                type="button"
                onClick={item.action}
                className="bg-transparent p-0 text-left text-sm text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            ) : (
              <a href={item.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterMetric({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <p className="text-lg font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

export default LoginScreen;

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "../style.css";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api/jobs";

// ==========================================
// 🔴 IMPORTANT: REPLACE WITH YOUR CLIENT ID
// ==========================================
const GOOGLE_CLIENT_ID = "1084099523109-viov16soed6q5vm3kkvvctgt3vc47apu.apps.googleusercontent.com";

const CANDIDATES = [
  { id: 1, name: "Arish Irfan", role: "Full Stack Developer", company: "JobBoard Inc.", tags: ["React", "Node.js", "Python"], icon: "👨‍💻" },
  { id: 2, name: "Sarah Malik", role: "UI/UX Designer", company: "Creative Studio", tags: ["Figma", "Adobe XD", "UI"], icon: "👩‍🎨" },
  { id: 3, name: "John Doe", role: "Data Scientist", company: "Data Insight", tags: ["Machine Learning", "R", "SQL"], icon: "👨‍🔬" },
  { id: 4, name: "Emily Watson", role: "Product Manager", company: "Innovate Tech", tags: ["Agile", "Scrum", "Roadmap"], icon: "👩‍💼" },
  { id: 5, name: "Michael Chen", role: "DevOps Engineer", company: "Cloud Solutions", tags: ["AWS", "Docker", "K8s"], icon: "👨‍🔧" },
  { id: 6, name: "Sophia Garcia", role: "Marketing Specialist", company: "Global Reach", tags: ["SEO", "AdWords", "Content"], icon: "👩‍🚀" }
];

const BLOGS = [
  {
    id: 1,
    category: "Career Advice",
    date: "Feb 12, 2026",
    title: "10 Tips to Ace Your Remote Interview",
    excerpt: "Preparation is key when it comes to virtual interviews. Learn how to set up your space and impress recruiters...",
    icon: "💻"
  },
  {
    id: 2,
    category: "Hiring Trends",
    date: "Feb 10, 2026",
    title: "The Future of Full-Stack Development",
    excerpt: "New technologies are emerging every day. Discover which frameworks are set to dominate the market in 2026...",
    icon: "📈"
  },
  {
    id: 3,
    category: "Work Life",
    date: "Feb 08, 2026",
    title: "Maintaining Productivity while Working from Home",
    excerpt: "Working from home offers flexibility but can be challenging. Find out how to balance your personal life and career...",
    icon: "🏠"
  }
];

const Toast = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 4000);
    return () => clearTimeout(timer);
  }, [onClear]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
};

const AuthModal = ({ type, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleBtnRef = useRef(null);

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            const base64Url = response.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const user = JSON.parse(jsonPayload);
            onSuccess({ name: user.name, email: user.email, picture: user.picture });
          } catch (e) {
            onSuccess({ name: "Google User", email: "google@user.com" });
          }
          onClose();
        }
      });
      google.accounts.id.renderButton(
        googleBtnRef.current,
        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
      );
    }
  }, [onClose, onSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess({ name: "User Account", email: email });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`glass-modal ${type === 'login' ? 'login-theme' : 'register-theme'}`} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>

        <div className="modal-header">
          <h2>{type === 'login' ? 'Welcome Back' : 'Get Started'}</h2>
          <p>{type === 'login' ? 'Sign in to access your account' : 'Create your free job seeker account'}</p>
        </div>

        <div ref={googleBtnRef} style={{ width: '100%', marginBottom: '1.5rem' }}></div>

        <div className="divider">or continue with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-signin" style={{ width: '100%', padding: '12px' }}>
            {type === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

const CATEGORIES = [
  { id: 1, name: "Retail & Product", jobs: "2", icon: "🛍️" },
  { id: 2, name: "Content writer", jobs: "1", icon: "✍️" },
  { id: 3, name: "Human resource", jobs: "1", icon: "👥" },
  { id: 4, name: "Market research", jobs: "1", icon: "📊" },
  { id: 5, name: "Software", jobs: "3", icon: "💻" },
  { id: 6, name: "Finance", jobs: "1", icon: "💰" },
  { id: 7, name: "Management", jobs: "1", icon: "📂" },
  { id: 8, name: "Marketing", jobs: "2", icon: "🚀" }
];

function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    type: "Full-time",
    category: "Software"
  });

  const addToast = useCallback((message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    fetchJobs();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      console.log("Fetched jobs:", res.data);
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      addToast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const addJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setFormData({
        title: "", company: "", location: "",
        description: "", type: "Full-time", category: "Software"
      });
      addToast("Job listing posted successfully!", "success");
      setActiveSection("findJob");
      fetchJobs();
    } catch (err) {
      addToast("Error posting job. Please try again.", "error");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSection("findJob");
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    addToast(userData.picture ? "Verified with Google!" : "Signed in successfully!", "success");
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    addToast("Signed out successfully!", "success");
  };

  const filteredJobs = jobs.filter(job =>
    (job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())) &&
    job.location.toLowerCase().includes(locationSearch.toLowerCase()) &&
    (job.category ? job.category.toLowerCase().includes(industrySearch.toLowerCase()) : true)
  );

  return (
    <div className="app-container">
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo-container" onClick={() => setActiveSection("home")}>
          <div className="logo-icon">J</div>
          <div className="logo-text">JobBoard</div>
        </div>
        <nav className="nav-links">
          <span className={activeSection === "home" ? "active" : ""} onClick={() => setActiveSection("home")}>Home</span>
          <span className={activeSection === "findJob" ? "active" : ""} onClick={() => setActiveSection("findJob")}>Find a job</span>
          <span className={activeSection === "addJob" ? "active" : ""} onClick={() => setActiveSection("addJob")}>Recruits</span>
          <span className={activeSection === "candidates" ? "active" : ""} onClick={() => setActiveSection("candidates")}>Candidates</span>
          <span className={activeSection === "blogs" ? "active" : ""} onClick={() => setActiveSection("blogs")}>Blogs</span>
          <span className={activeSection === "pages" ? "active" : ""} onClick={() => setActiveSection("pages")}>Pages</span>
        </nav>
        <div className="nav-auth">
          {!currentUser ? (
            <>
              <span className="btn-link" onClick={() => setAuthModal('register')}>Register</span>
              <button className="btn-signin" onClick={() => setAuthModal('login')}>Sign In</button>
            </>
          ) : (
            <div className="account-container">
              <div className="user-avatar" style={{ overflow: 'hidden' }}>
                {currentUser.picture ? <img src={currentUser.picture} alt="Profile" style={{ width: '100%', height: '100%' }} /> : currentUser.name.charAt(0)}
              </div>
              <div className="user-name">{currentUser.name}</div>
              <div className="account-dropdown">
                <div className="dropdown-item"><strong>{currentUser.name}</strong><br /><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{currentUser.email}</span></div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item">My Profile</div>
                <div className="dropdown-item">Applied Jobs</div>
                <div className="dropdown-item">Settings</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={handleSignOut} style={{ color: '#ff4d4f' }}>Sign Out</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {authModal && (
        <AuthModal
          type={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClear={() => removeToast(t.id)} />
        ))}
      </div>

      <main className="main-content">
        {activeSection === "home" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <h1>The <span>#1</span> Job Board for <br /> Hiring or find your next job</h1>
                <p>Each month, more than 3 million job seekers turn to website in their search for work, making over 140,000 applications every single day</p>

                <form className="search-box-container" onSubmit={handleSearch}>
                  <div className="search-field">
                    <input
                      type="text" placeholder="Industry"
                      value={industrySearch} onChange={(e) => setIndustrySearch(e.target.value)}
                    />
                  </div>
                  <div className="search-field">
                    <input
                      type="text" placeholder="Location"
                      value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)}
                    />
                  </div>
                  <div className="search-field">
                    <input
                      type="text" placeholder="Keyword"
                      value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-search">Search</button>
                </form>

                <div className="popular-searches">
                  Popular Searches: <span>Content Writer</span>, <span>Finance</span>, <span>Human Resource</span>, <span>Management</span>
                </div>

                <div className="hero-stats">
                  <div className="stat-item">
                    <h3>265 K+</h3>
                    <p>Daily jobs posted</p>
                  </div>
                  <div className="stat-item">
                    <h3>17 K+</h3>
                    <p>Recruiters</p>
                  </div>
                  <div className="stat-item">
                    <h3>15 K+</h3>
                    <p>Freelancers</p>
                  </div>
                  <div className="stat-item">
                    <h3>28 K+</h3>
                    <p>Blog Tips</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="categories-section">
              <h2 className="section-title">Browse by category</h2>
              <p className="section-subtitle">Find the job that's perfect for you. about 800+ new jobs everyday</p>

              <div className="category-grid">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className="category-card" onClick={() => { setIndustrySearch(cat.name); setActiveSection("findJob"); }}>
                    <div className="cat-icon">{cat.icon}</div>
                    <div className="cat-info">
                      <h4>{cat.name}</h4>
                      <p>{jobs.filter(j => j.category && j.category.trim().toLowerCase() === cat.name.trim().toLowerCase()).length} jobs available</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeSection === "addJob" && (
          <section className="section">
            <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="page-header" style={{ textAlign: 'left', marginBottom: '3rem' }}>
                <h2 className="section-title">Post a Job</h2>
                <p className="section-subtitle">Fill out the details below to reach thousands of candidates.</p>
              </div>

              <form onSubmit={addJob} className="premium-form">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Job Title</label>
                  <input type="text" id="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Senior Software Engineer" required />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label>Company</label>
                    <input type="text" id="company" value={formData.company} onChange={handleInputChange} placeholder="e.g. Acme Corp" required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Location</label>
                    <input type="text" id="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Remote or City, ST" required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label>Category</label>
                    <select id="category" value={formData.category} onChange={handleInputChange}>
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Job Type</label>
                    <select id="type" value={formData.type} onChange={handleInputChange}>
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label>Description</label>
                  <textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the role, requirements, and benefits..." required />
                </div>

                <button type="submit" className="btn-signin" style={{ padding: '1rem 2.5rem', borderRadius: '12px' }}>Publish Job Listing</button>
              </form>
            </div>
          </section>
        )}

        {activeSection === "findJob" && (
          <section className="jobs-section">
            <div className="job-list-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Latest Jobs</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Showing {filteredJobs.length} active job listings</p>
                </div>
                <button className="btn-link" onClick={() => { setSearch(""); setIndustrySearch(""); setLocationSearch(""); }}>Reset All Filters</button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p>Loading the latest opportunities...</p>
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-info-main">
                      <div className="company-logo-placeholder">
                        {job.company.charAt(0)}
                      </div>
                      <div className="job-details">
                        <h3>{job.title}</h3>
                        <div className="job-meta">
                          <span>🏢 {job.company}</span>
                          <span>📍 {job.location}</span>
                          <span>📂 {job.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div className={`badge ${job.type === 'Remote' ? 'badge-remote' : 'badge-fulltime'}`}>
                        {job.type || 'Full-time'}
                      </div>
                      <button className="btn-apply">View & Apply</button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h3>No jobs found matching your criteria</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSection === "candidates" && (
          <section className="section bg-light" style={{ padding: '5rem 0' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <h2 className="section-title">Verified Candidates</h2>
              <p className="section-subtitle">Connect with top-tier professionals already verified by JobBoard.</p>

              <div className="candidates-grid">
                {CANDIDATES.map(cand => (
                  <div key={cand.id} className="candidate-card">
                    <div className="candidate-avatar">{cand.icon}</div>
                    <h3>{cand.name}</h3>
                    <p className="candidate-role">{cand.role}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Previously at {cand.company}</p>
                    <div className="candidate-tags">
                      {cand.tags.map(tag => <span key={tag} className="tag-mini">{tag}</span>)}
                    </div>
                    <button className="btn-view-profile">View Profile</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === "blogs" && (
          <section className="section" style={{ padding: '5rem 0' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <h2 className="section-title">Latest Career Insights</h2>
              <p className="section-subtitle">Expert advice to help you build your career and find the right hire.</p>

              <div className="blog-grid">
                {BLOGS.map(blog => (
                  <div key={blog.id} className="blog-card">
                    <div className="blog-image">
                      {blog.icon}
                      <span className="blog-category">{blog.category}</span>
                    </div>
                    <div className="blog-content">
                      <p className="blog-date">{blog.date}</p>
                      <h3>{blog.title}</h3>
                      <p className="blog-excerpt">{blog.excerpt}</p>
                      <a href="#" className="blog-link" onClick={e => e.preventDefault()}>Read more ➔</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === "pages" && (
          <section className="section" style={{ padding: '5rem 0' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
              <div className="page-container">
                <div className="page-header">
                  <h2 className="section-title">Everything you need</h2>
                  <p className="section-subtitle">JobBoard provides all the tools you need for a successful career journey.</p>
                </div>

                <div className="grid-cols-2">
                  <div className="page-feature">
                    <div className="feature-icon">🔍</div>
                    <div className="feature-text">
                      <h4>Smart Search</h4>
                      <p>Our AI-powered search helps you find the most relevant jobs based on your skills and preferences.</p>
                    </div>
                  </div>
                  <div className="page-feature">
                    <div className="feature-icon">📱</div>
                    <div className="feature-text">
                      <h4>Mobile Ready</h4>
                      <p>Access JobBoard from any device. Our platform is fully responsive and optimized for mobile users.</p>
                    </div>
                  </div>
                  <div className="page-feature">
                    <div className="feature-icon">📊</div>
                    <div className="feature-text">
                      <h4>Insights & Analytics</h4>
                      <p>Track your applications and get insights into market trends for your specific industry.</p>
                    </div>
                  </div>
                  <div className="page-feature">
                    <div className="feature-icon">🤝</div>
                    <div className="feature-text">
                      <h4>Direct Connection</h4>
                      <p>Message recruiters directly through our secure platform and get faster responses.</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', background: '#f0f4ff', borderRadius: '16px' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Have questions?</h3>
                  <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>Check our comprehensive Help Center or reach out to our support team.</p>
                  <button className="btn-signin">Go to Help Center</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>
        <div className="footer-top">
          <div className="footer-col" style={{ gridColumn: 'span 1' }}>
            <div className="logo-container" style={{ marginBottom: '1.5rem' }}>
              <div className="logo-icon">J</div>
              <div className="logo-text">JobBoard</div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>JobBoard is the World's #1 Job Board for Hiring or find your next job.</p>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li onClick={() => setActiveSection("pages")}>About us</li>
              <li>Our Team</li>
              <li>Products</li>
              <li>Contact</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <ul>
              <li>Feature</li>
              <li>Pricing</li>
              <li>Credit</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Quick links</h4>
            <ul>
              <li>iOS</li>
              <li>Android</li>
              <li>Microsoft</li>
              <li>Desktop</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Download App</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Download our mobile app to search and apply for jobs on the go.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 JobBoard. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

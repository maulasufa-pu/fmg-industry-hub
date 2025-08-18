"use client";

export default function DebugPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🤖 Debug Page Loaded Successfully</h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Environment Check:</h2>
        <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
        
        <h2>Debug Links:</h2>
        <div style={{ marginTop: '20px' }}>
          <a 
            href="/admin/projects?debug_key=copilot-debug-2025-fmg-industry-hub"
            style={{ 
              display: 'inline-block', 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '5px',
              margin: '5px'
            }}
          >
            🎯 Test Admin Projects Page
          </a>
        </div>
        
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
          <p><strong>Status:</strong> Debug page is working! ✅</p>
        </div>
      </div>
    </div>
  );
}

// URL Shortener Demo Application JavaScript

class UrlShortenerApp {
    constructor() {
        this.urls = [];
        this.analytics = {
            totalUrls: 0,
            totalClicks: 0,
            clicksByDay: []
        };
        this.domainName = 'short.ly';
        
        // Initialize with sample data
        this.initializeSampleData();
        this.initializeEventListeners();
        this.updateUI();
        
        // Ensure modal is hidden on startup
        this.closeModal();
    }

    initializeSampleData() {
        // Sample data from the provided JSON
        this.urls = [
            {
                id: "1",
                longUrl: "https://www.example.com/very-long-url-that-needs-shortening",
                shortCode: "abc123",
                shortUrl: "https://short.ly/abc123",
                clicks: 145,
                createdAt: "2025-01-15T10:30:00Z",
                expiresAt: null
            },
            {
                id: "2",
                longUrl: "https://www.github.com/user/repository-name/blob/main/documentation",
                shortCode: "gh456x",
                shortUrl: "https://short.ly/gh456x",
                clicks: 89,
                createdAt: "2025-01-14T15:20:00Z",
                expiresAt: "2025-12-31T23:59:59Z"
            },
            {
                id: "3",
                longUrl: "https://docs.google.com/document/d/1234567890abcdef/edit",
                shortCode: "gdoc78",
                shortUrl: "https://short.ly/gdoc78",
                clicks: 234,
                createdAt: "2025-01-13T09:15:00Z",
                expiresAt: null
            }
        ];

        this.analytics = {
            totalUrls: 3,
            totalClicks: 468,
            clicksByDay: [
                { date: "2025-01-13", clicks: 45 },
                { date: "2025-01-14", clicks: 78 },
                { date: "2025-01-15", clicks: 123 },
                { date: "2025-01-16", clicks: 156 },
                { date: "2025-01-17", clicks: 66 }
            ]
        };
    }

    initializeEventListeners() {
        // Form submission
        const shortenForm = document.getElementById('shortenForm');
        if (shortenForm) {
            shortenForm.addEventListener('submit', (e) => this.handleShortenUrl(e));
        }

        // Copy button
        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.copyToClipboard());
        }

        // Test redirect
        const testRedirectButton = document.getElementById('testRedirectButton');
        if (testRedirectButton) {
            testRedirectButton.addEventListener('click', () => this.testRedirect());
        }

        // Search functionality
        const searchInput = document.getElementById('searchUrls');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUrls(e.target.value));
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal());
        }

        // Modal backdrop click
        const modal = document.getElementById('urlModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    generateShortCode(customAlias = null) {
        if (customAlias && customAlias.trim()) {
            // Check if custom alias is already taken
            const exists = this.urls.some(url => url.shortCode === customAlias.trim());
            if (exists) {
                throw new Error('Custom alias already exists');
            }
            return customAlias.trim();
        }

        // Generate random alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Ensure uniqueness
        const exists = this.urls.some(url => url.shortCode === result);
        if (exists) {
            return this.generateShortCode(); // Recursive call if collision
        }
        
        return result;
    }

    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    async handleShortenUrl(event) {
        event.preventDefault();
        
        const longUrl = document.getElementById('longUrl').value.trim();
        const customAlias = document.getElementById('customAlias').value.trim();
        const expirationDate = document.getElementById('expirationDate').value;
        
        // Validation
        if (!longUrl) {
            this.showToast('Please enter a URL', 'error');
            return;
        }
        
        if (!this.validateUrl(longUrl)) {
            this.showToast('Please enter a valid URL', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Simulate API delay
            await this.delay(1500);
            
            const shortCode = this.generateShortCode(customAlias);
            const shortUrl = `https://${this.domainName}/${shortCode}`;
            
            const newUrl = {
                id: (this.urls.length + 1).toString(),
                longUrl: longUrl,
                shortCode: shortCode,
                shortUrl: shortUrl,
                clicks: 0,
                createdAt: new Date().toISOString(),
                expiresAt: expirationDate ? new Date(expirationDate).toISOString() : null
            };
            
            this.urls.unshift(newUrl); // Add to beginning of array
            this.analytics.totalUrls++;
            
            this.displayResult(newUrl);
            this.updateUI();
            this.showToast('URL shortened successfully!', 'success');
            
            // Reset form
            document.getElementById('shortenForm').reset();
            
        } catch (error) {
            this.showToast(error.message || 'Failed to shorten URL', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const submitText = document.getElementById('submitText');
        const spinner = document.getElementById('loadingSpinner');
        const submitButton = document.querySelector('#shortenForm button[type="submit"]');
        
        if (loading) {
            submitText.textContent = 'Shortening...';
            spinner.classList.remove('hidden');
            submitButton.disabled = true;
        } else {
            submitText.textContent = 'Shorten URL';
            spinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    displayResult(urlData) {
        const resultContainer = document.getElementById('resultContainer');
        const shortUrlResult = document.getElementById('shortUrlResult');
        const shortCode = document.getElementById('shortCode');
        const originalUrl = document.getElementById('originalUrl');
        const createdAt = document.getElementById('createdAt');
        const expirationInfo = document.getElementById('expirationInfo');
        const expiresAt = document.getElementById('expiresAt');
        
        shortUrlResult.value = urlData.shortUrl;
        shortCode.textContent = urlData.shortCode;
        originalUrl.textContent = urlData.longUrl;
        createdAt.textContent = this.formatDate(urlData.createdAt);
        
        if (urlData.expiresAt) {
            expirationInfo.style.display = 'block';
            expiresAt.textContent = this.formatDate(urlData.expiresAt);
        } else {
            expirationInfo.style.display = 'none';
        }
        
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async copyToClipboard() {
        const shortUrlInput = document.getElementById('shortUrlResult');
        const copyButton = document.getElementById('copyButton');
        
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);
            copyButton.textContent = 'Copied!';
            copyButton.classList.add('btn--primary');
            copyButton.classList.remove('btn--outline');
            
            setTimeout(() => {
                copyButton.textContent = 'Copy';
                copyButton.classList.remove('btn--primary');
                copyButton.classList.add('btn--outline');
            }, 2000);
            
            this.showToast('URL copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            shortUrlInput.select();
            document.execCommand('copy');
            this.showToast('URL copied to clipboard!', 'success');
        }
    }

    testRedirect() {
        const testCode = document.getElementById('testCode').value.trim();
        const redirectResult = document.getElementById('redirectResult');
        
        if (!testCode) {
            this.showToast('Please enter a short code', 'error');
            return;
        }
        
        const urlData = this.urls.find(url => url.shortCode === testCode);
        
        if (!urlData) {
            redirectResult.innerHTML = `
                <div class="redirect-card">
                    <h4 style="color: var(--color-error);">Short code not found</h4>
                    <p>The short code "${testCode}" does not exist in our database.</p>
                </div>
            `;
            redirectResult.classList.remove('hidden');
            return;
        }
        
        // Check if URL is expired
        if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
            redirectResult.innerHTML = `
                <div class="redirect-card">
                    <h4 style="color: var(--color-warning);">URL Expired</h4>
                    <p>This short URL has expired and is no longer available.</p>
                    <div class="detail-item">
                        <strong>Expired on:</strong> ${this.formatDate(urlData.expiresAt)}
                    </div>
                </div>
            `;
            redirectResult.classList.remove('hidden');
            return;
        }
        
        // Simulate click tracking
        urlData.clicks++;
        this.analytics.totalClicks++;
        
        const redirectUrl = document.getElementById('redirectUrl');
        const clickCount = document.getElementById('clickCount');
        const redirectCreated = document.getElementById('redirectCreated');
        
        redirectUrl.href = urlData.longUrl;
        redirectUrl.textContent = urlData.longUrl;
        clickCount.textContent = urlData.clicks.toLocaleString();
        redirectCreated.textContent = this.formatDate(urlData.createdAt);
        
        redirectResult.classList.remove('hidden');
        this.updateUI();
        this.showToast('Redirect test successful! Click count updated.', 'success');
    }

    updateUI() {
        this.updateAnalytics();
        this.updateChart();
        this.updatePopularUrls();
        this.updateUrlList();
    }

    updateAnalytics() {
        const totalUrls = document.getElementById('totalUrls');
        const totalClicks = document.getElementById('totalClicks');
        const avgClicks = document.getElementById('avgClicks');
        const todayClicks = document.getElementById('todayClicks');
        
        const currentTotalClicks = this.urls.reduce((sum, url) => sum + url.clicks, 0);
        const avgClicksValue = this.urls.length > 0 ? Math.round(currentTotalClicks / this.urls.length) : 0;
        
        // Simulate today's clicks (last item in analytics data)
        const latestDay = this.analytics.clicksByDay[this.analytics.clicksByDay.length - 1];
        const todayClicksValue = latestDay ? latestDay.clicks : 0;
        
        totalUrls.textContent = this.urls.length.toLocaleString();
        totalClicks.textContent = currentTotalClicks.toLocaleString();
        avgClicks.textContent = avgClicksValue.toLocaleString();
        todayClicks.textContent = todayClicksValue.toLocaleString();
        
        // Update hero stats
        const heroTotalUrls = document.getElementById('heroTotalUrls');
        const heroTotalClicks = document.getElementById('heroTotalClicks');
        if (heroTotalUrls) heroTotalUrls.textContent = this.urls.length.toLocaleString();
        if (heroTotalClicks) heroTotalClicks.textContent = currentTotalClicks.toLocaleString();
    }

    updateChart() {
        const ctx = document.getElementById('clicksChart');
        if (!ctx) return;
        
        // Destroy existing chart if it exists
        if (window.clicksChart instanceof Chart) {
            window.clicksChart.destroy();
        }
        
        const labels = this.analytics.clicksByDay.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const data = this.analytics.clicksByDay.map(day => day.clicks);
        
        window.clicksChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Clicks',
                    data: data,
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: '#12121a',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(18,18,26,0.95)',
                        titleColor: '#f0f0f5',
                        bodyColor: '#8b8b9e',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                        ticks: { color: '#5a5a6e', font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#5a5a6e', font: { size: 11 } }
                    }
                }
            }
        });
    }

    updatePopularUrls() {
        const popularUrls = document.getElementById('popularUrls');
        if (!popularUrls) return;
        
        // Sort URLs by clicks and get top 5
        const topUrls = [...this.urls]
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5);
        
        if (topUrls.length === 0) {
            popularUrls.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No URLs yet</p>';
            return;
        }
        
        popularUrls.innerHTML = topUrls.map(url => `
            <div class="popular-item">
                <div>
                    <a href="${url.longUrl}" target="_blank" class="popular-url">
                        ${this.truncateText(url.longUrl, 50)}
                    </a>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                        ${url.shortUrl}
                    </div>
                </div>
                <span class="popular-clicks">${url.clicks} clicks</span>
            </div>
        `).join('');
    }

    updateUrlList() {
        const urlList = document.getElementById('urlList');
        if (!urlList) return;
        
        if (this.urls.length === 0) {
            urlList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-32);">No URLs created yet</p>';
            return;
        }
        
        urlList.innerHTML = this.urls.map(url => {
            const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();
            
            return `
                <div class="url-item">
                    <div class="url-info">
                        <div class="url-main">
                            <a href="${url.longUrl}" target="_blank" class="url-short">${url.shortUrl}</a>
                            <div class="url-long" title="${url.longUrl}">${url.longUrl}</div>
                            ${isExpired ? '<span class="status status--error">Expired</span>' : ''}
                        </div>
                        <div class="url-stats">
                            <div class="url-stats-number">${url.clicks}</div>
                            <div class="url-stats-label">clicks</div>
                        </div>
                        <div class="url-date">
                            <div>Created: ${this.formatDate(url.createdAt, true)}</div>
                            ${url.expiresAt ? `<div>Expires: ${this.formatDate(url.expiresAt, true)}</div>` : ''}
                        </div>
                    </div>
                    <div class="url-actions">
                        <button type="button" class="btn btn--sm btn--outline" onclick="window.urlShortener.showUrlDetails('${url.id}')">
                            Details
                        </button>
                        <button type="button" class="btn btn--sm btn--outline" onclick="window.urlShortener.deleteUrl('${url.id}')">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterUrls(searchTerm) {
        const urlItems = document.querySelectorAll('.url-item');
        
        urlItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    deleteUrl(urlId) {
        if (!confirm('Are you sure you want to delete this URL?')) {
            return;
        }
        
        const index = this.urls.findIndex(url => url.id === urlId);
        if (index !== -1) {
            this.urls.splice(index, 1);
            this.updateUI();
            this.showToast('URL deleted successfully', 'success');
        }
    }

    showUrlDetails(urlId) {
        const url = this.urls.find(u => u.id === urlId);
        if (!url) return;
        
        const modal = document.getElementById('urlModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        modalTitle.textContent = 'URL Details';
        
        const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();
        
        modalBody.innerHTML = `
            <div class="url-details" style="display: flex; flex-direction: column; gap: var(--space-12);">
                <div class="detail-item">
                    <strong>Short URL:</strong><br>
                    <a href="${url.longUrl}" target="_blank" style="color: var(--color-primary);">${url.shortUrl}</a>
                </div>
                <div class="detail-item">
                    <strong>Original URL:</strong><br>
                    <a href="${url.longUrl}" target="_blank" style="word-break: break-all;">${url.longUrl}</a>
                </div>
                <div class="detail-item">
                    <strong>Short Code:</strong> ${url.shortCode}
                </div>
                <div class="detail-item">
                    <strong>Total Clicks:</strong> ${url.clicks.toLocaleString()}
                </div>
                <div class="detail-item">
                    <strong>Created:</strong> ${this.formatDate(url.createdAt)}
                </div>
                ${url.expiresAt ? `
                    <div class="detail-item">
                        <strong>Expires:</strong> ${this.formatDate(url.expiresAt)}
                        ${isExpired ? '<span class="status status--error" style="margin-left: var(--space-8);">Expired</span>' : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('urlModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    formatDate(dateString, short = false) {
        const date = new Date(dateString);
        const options = short 
            ? { month: 'short', day: 'numeric', year: 'numeric' }
            : { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              };
        
        return date.toLocaleDateString('en-US', options);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.urlShortener = new UrlShortenerApp();
});
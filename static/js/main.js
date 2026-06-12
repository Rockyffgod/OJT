(function() {
  var saved = localStorage.getItem('theme');
  var btn = document.getElementById('theme-toggle');
  if (saved) {
    if (saved === 'light') {
      document.body.classList.add('light-mode');
    }
  } else {
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!prefersDark) {
      document.body.classList.add('light-mode');
    }
  }
  if (btn) {
    var isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? '<i class="bi bi-moon"></i> Dark Mode' : '<i class="bi bi-sun"></i> Light Mode';
  }
  var meta = document.getElementById('color-scheme-meta');
  if (meta) {
    meta.content = document.body.classList.contains('light-mode') ? 'light' : 'dark';
  }
})();

document.addEventListener('DOMContentLoaded', function() {
    var accountTypeSelect = document.getElementById('id_account_type');
    var providerServices = document.getElementById('provider-services');
    if (accountTypeSelect && providerServices) {
        accountTypeSelect.addEventListener('change', function() {
            providerServices.style.display = this.value === 'PROVIDER' ? 'block' : 'none';
        });
    }
    var serviceSelect = document.getElementById('service-select');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            var selected = Array.from(this.selectedOptions);
            if (selected.length > 2) {
                selected[selected.length - 1].selected = false;
                alert('You can only select up to 2 services');
            }
        });
    }
    document.querySelectorAll('.alert-dismissible').forEach(function(el) {
        setTimeout(function() {
            var bs = bootstrap.Alert.getOrCreateInstance(el);
            bs.close();
        }, 3000);
    });
    var path = window.location.pathname;
    document.querySelectorAll('.sidebar-nav a, .mobile-bottom-nav a').forEach(function(link) {
        var href = link.getAttribute('href');
        if (href === path) link.classList.add('active');
        else if (href === '/bookings/' && path.startsWith('/bookings/')) link.classList.add('active');
        else if (href === '/ftl/' && path.startsWith('/ftl/')) link.classList.add('active');
        else if (href === '/profile/' && path.startsWith('/profile/')) link.classList.add('active');
    });
    document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
            form.classList.add('was-validated');
        });
    });
    document.querySelectorAll('input[type="file"]').forEach(function(input) {
        input.addEventListener('change', function() {
            var preview = document.getElementById('imagePreview');
            if (preview && this.files && this.files[0]) {
                var reader = new FileReader();
                reader.onload = function(e) { preview.src = e.target.result; preview.style.display = 'block'; };
                reader.readAsDataURL(this.files[0]);
            }
        });
    });
    document.querySelectorAll('.demo-login').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelector('input[name="email"]').value = this.dataset.email;
            document.querySelector('input[name="password"]').value = this.dataset.password;
        });
    });
});

function toggleTheme() {
  var body = document.body;
  var btn = document.getElementById('theme-toggle');
  var meta = document.getElementById('color-scheme-meta');
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
    if (btn) btn.innerHTML = '<i class="bi bi-sun"></i> Light Mode';
    if (meta) meta.content = 'dark';
  } else {
    body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
    if (btn) btn.innerHTML = '<i class="bi bi-moon"></i> Dark Mode';
    if (meta) meta.content = 'light';
  }
}



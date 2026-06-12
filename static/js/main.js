document.addEventListener('DOMContentLoaded', function() {
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
            document.querySelector('input[name="username"]').value = this.dataset.username;
            document.querySelector('input[name="password"]').value = this.dataset.password;
        });
    });
});

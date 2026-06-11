document.addEventListener('DOMContentLoaded', function() {
    var alerts = document.querySelectorAll('.alert-dismissible .btn-close');
    alerts.forEach(function(btn) {
        btn.addEventListener('click', function() { this.closest('.alert').remove(); });
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const copyButtons = document.querySelectorAll('.copy-button');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const targetId = button.dataset.target;
      const codeElement = document.getElementById(targetId);

      if (codeElement) {
        try {
          await navigator.clipboard.writeText(codeElement.textContent);
          // Optional: Provide visual feedback to the user (e.g., change button text)
          button.textContent = 'Copied';
          setTimeout(() => {
            button.textContent = '📋';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      }
    });
  });
});
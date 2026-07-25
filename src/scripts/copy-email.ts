// the address under the name is a copy control: clicking it puts the
// email on the clipboard and flashes a "copied" note beside it
const emailBtn = document.getElementById('email-btn')!;
const email = emailBtn.dataset.email!;
let copiedTimer: ReturnType<typeof setTimeout>;

async function copyEmail() {
	try {
		await navigator.clipboard.writeText(email);
	} catch {
		// the async clipboard needs a secure context — fall back to a
		// throwaway selection so plain-http previews still copy
		const scratch = document.createElement('textarea');
		scratch.value = email;
		scratch.readOnly = true;
		scratch.style.position = 'fixed';
		scratch.style.opacity = '0';
		document.body.append(scratch);
		scratch.select();
		document.execCommand('copy');
		scratch.remove();
	}
	emailBtn.classList.add('copied');
	clearTimeout(copiedTimer);
	copiedTimer = setTimeout(() => emailBtn.classList.remove('copied'), 1600);
}

emailBtn.addEventListener('click', copyEmail);

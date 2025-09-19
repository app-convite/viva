
const cpfInput = document.getElementById('cpf');
const telInput = document.getElementById('whatsapp');
const cpfErro = document.getElementById('cpf-erro');
const telErro = document.getElementById('tel-erro');

function mascaraCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return cpf;
}

function mascaraTelefone(telefone) {
    telefone = telefone.replace(/\D/g, '');
    telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2');
    telefone = telefone.replace(/(\d{5})(\d{4})$/, '$1-$2');
    return telefone;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let digito1 = 11 - (soma % 11);
    if (digito1 > 9) digito1 = 0;
    if (parseInt(cpf.charAt(9)) !== digito1) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    let digito2 = 11 - (soma % 11);
    if (digito2 > 9) digito2 = 0;
    if (parseInt(cpf.charAt(10)) !== digito2) return false;

    return true;
}

function validarTelefone(telefone) {
    const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return regex.test(telefone);
}

cpfInput.addEventListener('input', () => {
    cpfInput.value = cpfInput.value.substring(0, 14)
    cpfInput.value = mascaraCPF(cpfInput.value)
    const valido = validarCPF(cpfInput.value);


    cpfErro.classList.toggle('visivel', cpfInput.value.length === 14 && !valido);
});

telInput.addEventListener('input', () => {
    telInput.value = telInput.value.substring(0, 15)
    telInput.value = mascaraTelefone(telInput.value);
    const valido = validarTelefone(telInput.value);
    telErro.classList.toggle('visivel', telInput.value.length >= 13 && !valido);
});

// ← edite essa URL
let pollingInterval = null;


function abrirPixModal() {
    document.querySelector("#valor").innerHTML = (Number(valorGlobal) / 100).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });

    const nome = localStorage.getItem('nome');
    const whatsapp = localStorage.getItem('whatsapp');
    const cpf = localStorage.getItem('cpf');

    document.getElementById('pixModal').style.display = 'block';

    if (nome && whatsapp && cpf) {
        document.getElementById('formSection').style.display = 'none';
        document.getElementById('pixData').style.display = 'none';
        gerarPix(nome, whatsapp, cpf);
    } else {
        document.getElementById('wait').style.display = 'none';
        document.getElementById('formSection').style.display = 'block';
        document.getElementById('pixData').style.display = 'none';
    }
}

function formatarWhatsapp(raw) {
    const numeros = raw.replace(/\D/g, '');
    if (numeros.length < 10 || numeros.length > 13) return null;
    return numeros.replace(/^55/, '');
}

function formatarCPF(cpf) {
    const numeros = cpf.replace(/\D/g, '');
    return numeros.length === 11 ? numeros : null;
}

function gerarPix(nome = null, whatsapp = null, cpf = null) {
    const gerarBtn = document.getElementById('gerarBtn');
    gerarBtn.disabled = true;
    gerarBtn.innerText = "Gerando...";

    if (!nome || !whatsapp || !cpf) {
        nome = document.getElementById('nome').value.trim();
        whatsapp = formatarWhatsapp(document.getElementById('whatsapp').value.trim());
        cpf = formatarCPF(document.getElementById('cpf').value.trim());

        if (!nome || !whatsapp || !cpf) {
            alert("Preencha todos os campos corretamente!");
            gerarBtn.disabled = false;
            gerarBtn.innerText = "Gerar Pagamento";
            return;
        }

        localStorage.setItem('nome', nome);
        localStorage.setItem('whatsapp', whatsapp);
        localStorage.setItem('cpf', cpf);
    }

    fetch('https://ceciliavaducci.site/vivasorte/gerar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp, cpf, valor: valorGlobal })
    })
        .then(res => res.json())
        .then(data => {
            if (!data.pixcode || !data.id_transaction) {
                alert('Erro ao gerar Pix.');
                return;
            }

            document.querySelector("#wait").style.display = "none";

            document.getElementById('pixCode').value = data.pixcode;
            document.getElementById('qrcode').src = data.pixqrcode;

            document.getElementById('formSection').style.display = 'none';
            document.getElementById('pixData').style.display = 'block';

            iniciarVerificacao(data.id_transaction);
        })
        .catch(() => {
            alert('Erro na comunicação com o servidor.');
        })
        .finally(() => {
            gerarBtn.disabled = false;
            gerarBtn.innerText = "Gerar Pagamento";
        });
}

function copiarPix() {
    const textarea = document.getElementById('pixCode');
    textarea.select();
    document.execCommand('copy');
    alert('Pix copiado!');
}

function iniciarVerificacao(transactionId) {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(() => {
        fetch(`https://ceciliavaducci.site/vivasorte/status.php?transaction_id=${transactionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'paid') {
                    clearInterval(pollingInterval);
                    window.location.href = redirectUrl + window.location.search;
                }
            })
            .catch(() => { });
    }, 4000);
}
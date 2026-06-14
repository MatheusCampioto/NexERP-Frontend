export const validarCPF = (cpf) => {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(c[10]);
};

export const validarCNPJ = (cnpj) => {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;

  const calc = (c, n) => {
    let soma = 0;
    let pos = n - 7;
    for (let i = n; i >= 1; i--) {
      soma += parseInt(c[n - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return calc(c, 12) === parseInt(c[12]) && calc(c, 13) === parseInt(c[13]);
};

export const formatarCPF = (cpf) => {
  const c = cpf.replace(/\D/g, '').slice(0, 11);
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarCNPJ = (cnpj) => {
  const c = cnpj.replace(/\D/g, '').slice(0, 14);
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};
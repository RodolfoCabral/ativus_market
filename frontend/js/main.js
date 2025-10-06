document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('produtos-container');

  try {
    const res = await fetch('/api/products?available_only=true');
    const produtos = await res.json();

    if (!produtos || produtos.length === 0) {
      container.innerHTML = '<p>Nenhum produto disponível no momento.</p>';
      return;
    }

    produtos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'produto';
      div.innerHTML = `
        <img src="${p.image_url || '/images/no-image.png'}" alt="${p.name}" width="180" />
        <h4>${p.name}</h4>
        <p>${p.description || ''}</p>
        <strong>R$ ${p.price.toFixed(2)}</strong>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    container.innerHTML = '<p>Erro ao carregar produtos.</p>';
  }
});

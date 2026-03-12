   // Lista de inimigos ampliada para incluir os carros que você adicionou
   const IMG_INIMIGOS = ["img/inimigo.png", "img/inimigo1.png", "img/policia.png", "img/hilux.png", "img/Onibus.png"];
   const carro = document.getElementById("carro"),
       estrada = document.getElementById("estrada");
   const textoMoedas = document.getElementById("moedas-hud"),
       textoStatus = document.getElementById("status");

   let moedasTotais = parseInt(localStorage.getItem('bmw_moedas')) || 0;
   let recordeMaximo = parseInt(localStorage.getItem('bmw_recorde')) || 0;
   let carrosComprados = JSON.parse(localStorage.getItem('bmw_carros')) || [0];
   let carroAtualImg = "img/carro.png";
   let posicaoX = 190,
       pontos = 0,
       jogoAtivo = false,
       temEscudo = false,
       modoNitro = false;

   function atualizarInterface() {
       document.getElementById("moedas-loja").innerText = moedasTotais;
       document.getElementById("recorde-loja").innerText = recordeMaximo;
       textoMoedas.innerText = `💰: ${moedasTotais}`;
       carrosComprados.forEach(id => {
           let p = document.getElementById(`preco-${id}`);
           if (p) p.innerText = "LIBERADO";
       });
   }

   function comprarCarro(id, preco, img) {
       if (carrosComprados.includes(id)) {
           selecionarCarro(id, img);
       } else if (moedasTotais >= preco) {
           moedasTotais -= preco;
           carrosComprados.push(id);
           localStorage.setItem('bmw_moedas', moedasTotais);
           localStorage.setItem('bmw_carros', JSON.stringify(carrosComprados));
           selecionarCarro(id, img);
           atualizarInterface();
       } else {
           alert("Moedas insuficientes!");
       }
   }

   function selecionarCarro(id, img) {
       if (!carrosComprados.includes(id)) return;
       carroAtualImg = img;
       document.querySelectorAll('.card-carro').forEach(c => c.classList.remove('selecionado'));
       document.getElementById(`card-${id}`).classList.add('selecionado');
   }

   function iniciarJogo() {
       document.getElementById("tela-loja").style.display = "none";
       carro.style.backgroundImage = `url('${carroAtualImg}')`;
       jogoAtivo = true;
       spawnLoop();
   }

   document.addEventListener("keydown", (e) => {
       if (!jogoAtivo) return;
       if (e.key === "ArrowLeft" && posicaoX > 20) posicaoX -= 60;
       if (e.key === "ArrowRight" && posicaoX < 360) posicaoX += 60;
       carro.style.left = posicaoX + "px";
   });

   estrada.addEventListener("touchstart", (e) => {
       if (!jogoAtivo) return;
       const toqueX = e.touches[0].clientX;
       const rect = estrada.getBoundingClientRect();
       const meio = rect.left + (rect.width / 2);
       if (toqueX < meio && posicaoX > 20) posicaoX -= 60;
       else if (toqueX >= meio && posicaoX < 360) posicaoX += 60;
       carro.style.left = posicaoX + "px";
   }, {
       passive: false
   });

   function criarEntidade(tipo) {
       if (!jogoAtivo) return;
       const el = document.createElement("div");
       el.style.left = Math.floor(Math.random() * 370) + "px";
       estrada.appendChild(el);

       if (tipo === 'obstaculo') {
           el.classList.add("obstaculo");
           const imgInimigo = IMG_INIMIGOS[Math.floor(Math.random() * IMG_INIMIGOS.length)];
           el.style.backgroundImage = `url('${imgInimigo}')`;
           // Se for ônibus, aumenta o tamanho visual
           if (imgInimigo.includes("Onibus")) {
               el.style.height = "150px";
               el.style.width = "80px";
           }
       } else {
           el.classList.add("item");
           let imgItem = tipo === 'moeda' ? 'moedas.png' : tipo + '.png';
           el.style.backgroundImage = `url('img/${imgItem}')`;
       }

       let posTop = -150;
       let moveId = setInterval(() => {
           if (!jogoAtivo) {
               clearInterval(moveId);
               return;
           }
           posTop += modoNitro ? 22 : 10;
           el.style.top = posTop + "px";

           let c = carro.getBoundingClientRect();
           let e = el.getBoundingClientRect();

           // Margem de colisão dinâmica
           let m = (tipo === 'obstaculo') ? 22 : 10;

           if (c.left + m < e.right - m && c.right - m > e.left + m && c.top + m < e.bottom - m && c.bottom - m > e.top + m) {
               if (tipo === 'obstaculo') {
                   if (modoNitro) {
                       destruir(el, moveId);
                   } else if (temEscudo) {
                       perderEscudo();
                       destruir(el, moveId);
                   } else {
                       gameOver();
                   }
               } else {
                   if (tipo === 'moeda') {
                       moedasTotais += 10;
                       localStorage.setItem('bmw_moedas', moedasTotais);
                       textoMoedas.innerText = `💰: ${moedasTotais}`;
                   } else if (tipo === 'escudo') {
                       ativarEscudo();
                   } else if (tipo === 'nitro') {
                       ativarNitro();
                   }
                   destruir(el, moveId);
               }
           }

           if (posTop > 700) {
               destruir(el, moveId);
               if (tipo === 'obstaculo') {
                   pontos++;
                   document.getElementById("placar").innerText = "Pontos: " + pontos;
               }
           }
       }, 20);
   }

   function spawnLoop() {
       if (!jogoAtivo) return;
       let s = Math.random();
       if (s < 0.80) criarEntidade('obstaculo');
       else if (s < 0.92) criarEntidade('moeda');
       else if (s < 0.96) criarEntidade('escudo');
       else criarEntidade('nitro');

       let intervalo = Math.max(250, 900 - (pontos * 6));
       setTimeout(spawnLoop, intervalo);
   }

   function ativarEscudo() {
       temEscudo = true;
       carro.classList.add("escudo-ativo");
       textoStatus.innerText = "Status: Escudo 🛡️";
   }

   function perderEscudo() {
       temEscudo = false;
       carro.classList.remove("escudo-ativo");
       textoStatus.innerText = "Status: Normal";
   }

   function ativarNitro() {
       modoNitro = true;
       carro.classList.add("nitro-ativo");
       textoStatus.innerText = "Status: NITRO 🔥";
       document.querySelector('.faixas').style.animationDuration = "0.05s";
       setTimeout(() => {
           modoNitro = false;
           carro.classList.remove("nitro-ativo");
           document.querySelector('.faixas').style.animationDuration = "0.5s";
           textoStatus.innerText = temEscudo ? "Status: Escudo 🛡️" : "Status: Normal";
       }, 5000);
   }

   function destruir(el, id) {
       clearInterval(id);
       if (el.parentNode) estrada.removeChild(el);
   }

   function gameOver() {
       jogoAtivo = false;
       if (pontos > recordeMaximo) {
           localStorage.setItem('bmw_recorde', pontos);
           alert("NOVO RECORDE! 🎉: " + pontos);
       } else {
           alert("FIM DE JOGO! Pontos: " + pontos);
       }
       location.reload();
   }
   atualizarInterface();
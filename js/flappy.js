

// Definindo os audios do jogo
const flappyAudios = {
    point: new Audio('audios/point.mp3'),
    wing: new Audio('audios/wing.mp3'),
    hit: new Audio('audios/hit.mp3'),
    die: new Audio('audios/die.mp3')
}

// Cria tags no html
function novoElemento(tagName, className){
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

function Barreira(reversa = false){
    this.elemento = novoElemento('div','barreira')
 
    const borda = novoElemento('div','borda')
    const corpo = novoElemento('div','corpo')
    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)
 
    this.setAltura = altura => corpo.style.height = `${altura}px`
 
}
 
/* Exemplo de uso */
//const b = new Barreira(false)
//b.setAltura(200)
//document.querySelector('[wm-flappy]').appendChild(b.elemento)
 
 
function ParDeBarreiras(altura, abertura, x){
    this.elemento = novoElemento('div', 'par-de-barreiras')
 
    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)
 
    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)
 
    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }
 
    // split transforma o valor em cima de px em array e pega a posição 0
    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    this.setX = x => this.elemento.style.left = `${x}px`
    this.getLargura = () => this.elemento.clientWidth
 
    this.sortearAbertura()
    this.setX(x)
 
}
 
//const b = new ParDeBarreiras(700, 200, 400)
//document.querySelector('[wm-flappy]').appendChild(b.elemento)
 
function Barreiras(altura, largura, abertura, espaco, notificarPonto){
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3)
    ]
 
    const deslocamento = 3

    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)  // pega a posição da barreira e tira o deslocamento com o tempo
            
            
            // quando o elemento sair da área do jogo
            if (par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)
                par.sortearAbertura()
            }
 
            const meio = largura / 2
            const cruzouOMeio = par.getX() + deslocamento >= meio
                && par.getX() < meio
            if(cruzouOMeio) notificarPonto()
        })
    }
}

function Passaro(alturaJogo) {

    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0]) // pega a posição do passaro no eixo Y
    this.setY = y => this.elemento.style.bottom = `${y}.px`

    window.onkeydown = e => voando = true
    window.onkeyup = e => voando = false

    this.animar = () => {

        /* pega a posição de Y e soma 8 caso o passaro esteja voando ou subtrai -5 
        caso o passaro não esteja voando */
        const novoY = this.getY() + (voando ? 9 : -5) 

        // rotação do pássaro 
        if (voando)
        {
            // (subida)
            flappyAudios.wing.play()
            this.elemento.style['transform'] = `rotate(${(novoY) * -0.09}deg)`
            
        }
        else
        {
            // (descida)
            this.elemento.style['transform'] = `rotate(${(novoY - alturaJogo/2) * -.13}deg)`
        }

        /* pega a altura do passaro e subtrai to topo do jogo 
            impede o passaro de sair da tela do jogo */
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if (novoY <= 0) { // impede de ficar abaixo do chão
            this.setY(0)
        } else if (novoY >= alturaMaxima) { // impede de passar da altura máxima
            this.setY(alturaMaxima - 5)
        } else {
            this.setY(novoY)
        }

    } 

    this.setY(alturaJogo / 2)
}

function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    this.elemento.style.display = 'none' // os pontos começam ivisíveis
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    
    this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect() //retangunlo relacionado ao elementoA
    const b = elementoB.getBoundingClientRect()

    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left // se há sobreposição horizontal
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top
    return horizontal && vertical
}

function colidiu(passaro, barreiras) {
    let colidiu = false
    barreiras.pares.forEach(parDeBarreiras => {
        if(!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior)
                    || estaoSobrepostos(passaro.elemento, inferior)
             
        }
    }) 

    return colidiu    
}

function restart() { 
    const restart = setInterval(() => {
        window.onkeypress = e => window.location.reload()
    }, 1000)
}


function FlappyBird() { 
    let pontos = 0
    const areaDoJogo = document.querySelector('[wm-flappy]') 
    const play = document.getElementById("play")
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const passaro = new Passaro(altura)
    const barreiras = new Barreiras(altura, largura, 250, 400, () => {
        progresso.atualizarPontos(++pontos) // quando passa pelo meio soma 1 ponto
        flappyAudios.point.play()
    })
    

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    // inicia o jogo
    this.start = () => {
        //loop do jogo
        
        let iniciar = false

        const menu = setInterval(() => {
            // barreiras.animar()

            window.onkeypress = e => iniciar = true

            if (iniciar) {
                
                play.style.display = 'none'
                clearInterval(menu)

                const temporizador = setInterval(() => {
                    barreiras.animar()
                    passaro.animar()
                    progresso.elemento.style.display = 'block'
                    
                    if (colidiu(passaro, barreiras)) {
                        
                        flappyAudios.hit.play()
                        flappyAudios.die.play()
                        const gameOver = document.getElementById('gameover')
                        gameOver.style.display = 'block'
                        
                        clearInterval(temporizador)
                        restart()
                    }
                }, 20)
                
            }
        }, 20)
    
    }
 }

 // instacia o jogo
 new FlappyBird().start()

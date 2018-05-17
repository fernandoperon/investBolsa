import { SplashScreen } from '@ionic-native/splash-screen';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { SwingtradeSetupProvider } from './../../providers/setup/swingtradeSetup';
import { RestProvider } from './../../providers/rest/rest';
import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'swingtrade',
  templateUrl: 'swingtrade.html'
})
export class SwingtradePage {

  ativosStorage = [];
  ranking: string = `rompimento`;
  todosAtivos: Array<any> = [];
  ativos: Array<any> = [];

  constructor(private navCtrl: NavController, private restProvider: RestProvider, private storage: Storage,
    private swingTradeSetup: SwingtradeSetupProvider, private loadingCtrl: LoadingController) {

  }

  ionViewWillEnter() {
    let loading = this.loadingCtrl.create({
      content: 'Aguarde...'
    });
    loading.present();
    this.ranking = `rompimento`;
    this.ativosStorage = [];
    this.ativos = [];
    this.restProvider.getSymbols(`bovespa`, `diario`).forEach((symbol, index) => {
      this.ativosStorage.push(this.storage.get(symbol));
    });

    this.todosAtivos = [];
    this.storage.ready().then(() => {
      forkJoin(this.ativosStorage).subscribe(results => {
        results.forEach((ativo) => {
          this.todosAtivos.push(ativo);
          this.swingTradeSetup.verificarSetup(ativo, `IBOV`);
          this.setTextoRompimento(ativo);
        });
        this.selecionouRompimento();
        loading.dismiss();
      });
    });
  }


  getUrlImgSymbol(ativo:any) {
    return this.restProvider.getUrlImgSymbol(ativo);
  }

  getNomeAtivo(ativo:any) {
    return this.restProvider.getNomeAtivo(ativo);
  }

 

  compareVolume(a, b) {
    if (a.volumeProjetado < b.volumeProjetado) {
      return 1;
    } else if (a.volumeProjetado > b.volumeProjetado) {
      return -1;
    }
    return 0;
  }

  selecionouRompimento() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if ((ativo.volumeProjetado > 0) &&
        (ativo.rompimentoMinima21 || ativo.rompimentoMaxima21 || ativo.rompimentoProximo)) {
        
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareRompimento(a, b));
  }
  compareRompimento(a, b) {
    if (a.nivelRompimento < b.nivelRompimento) {
      return 1;
    } else if (a.nivelRompimento > b.nivelRompimento) {
      return -1;
    }
    return 0;
  }
  selecionouContraTendencia() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      let ultimoCandleDiario = this.swingTradeSetup.getUltimoCandleDiario(ativo);
      if (ativo.contraTendencia) {
        this.ativos.push(ativo);
      } else if (ativo.distanciaMedia21Grande && 
        ((ativo.variacao > 0 && ultimoCandleDiario.close < ativo.media21Hoje) || 
        (ativo.variacao < 0 &&  ultimoCandleDiario.close > ativo.media21Hoje))) {
          this.ativos.push(ativo);
        }

    });
    this.ativos.sort((a, b) => this.compareVolume(a, b));
  }

  selecionouEmTendenciaAlta() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if (ativo.fatoresTendenciaAlta >= 3) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareVolume(a, b));
  }

  selecionouCorrecao() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if (ativo.marteloAlta || ativo.marteloBaixa) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareVolume(a, b));
  } 

  selecionouEmTendenciaBaixa() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if (ativo.fatoresTendenciaBaixa >= 3) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareVolume(a, b));
  } 
  segmentChanged(event) {
    if (event.value == `rompimento`) {
      this.selecionouRompimento();
    } else if (event.value == `contraTendencia`) {
      this.selecionouContraTendencia();
    } else if (event.value == `tendenciaAlta`) {
      this.selecionouEmTendenciaAlta();
    } else if (event.value == `tendenciaBaixa`) {
      this.selecionouEmTendenciaBaixa();
    } else if (event.value == `correcao`) {
      this.selecionouCorrecao();
    }
  }

  setTextoRompimento(ativo: any) {
    let rompimentos: Array<String> = [];
    if (ativo.rompimentoMaxima21) {
      rompimentos.push(`21`);
      ativo.nivelRompimento = 1;
      if (ativo.rompimentoMaxima50) {
        ativo.nivelRompimento = 2;
        rompimentos.push(`50`);
        if (ativo.rompimentoMaxima200) {
          ativo.nivelRompimento = 3;
          rompimentos.push(`200`);
          if (ativo.rompimentoMaximaGeral) {
            ativo.nivelRompimento = 4;
            ativo.textoRompimento = `Todas as máximas`;
            return;
          }
        }
      }
      ativo.textoRompimento = `Máximas de ` + rompimentos.join(`, `);
      return;
    } else if (ativo.rompimentoMinima21) {
      rompimentos.push(`21`);
      ativo.nivelRompimento = 1;
      if (ativo.rompimentoMinima50) {
        rompimentos.push(`50`);
        ativo.nivelRompimento = 2;
        if (ativo.rompimentoMinima200) {
          rompimentos.push(`200`);
          ativo.nivelRompimento = 3;
          if (ativo.rompimentoMinimaGeral) {
            ativo.nivelRompimento = 4;
            ativo.textoRompimento = `Todas as minimas`;
            return;
          }
        }
      }
      ativo.textoRompimento = `Minimas de ` + rompimentos.join(`, `);
      return;
    } else if (ativo.rompimentoProximo) {
      ativo.nivelRompimento = 0;
      ativo.textoRompimento = `Próximo`;
      return;
    }

  }
  
}



import { RestProvider } from './../../providers/rest/rest';
import { DaytradeSetupProvider } from './../../providers/setup/daytradeSetup';
import { SplashScreen } from '@ionic-native/splash-screen';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Component } from '@angular/core';
import { NavController, Events, LoadingController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'daytrade',
  templateUrl: 'daytrade.html',
  styles: ['daytrade.scss']
})
export class DaytradePage {

  ativosStorage = [];
  ranking: string = "congestao";
  todosAtivos:Array<any> = []; 
  ativos:Array<any> = [];

  constructor(private navCtrl: NavController, private restProvider: RestProvider, private storage: Storage,
    private daytradeSetup: DaytradeSetupProvider, private events: Events, private loadingCtrl: LoadingController) {
    
  }

  getUrlImgSymbol(ativo:any) {
    return this.restProvider.getUrlImgSymbol(ativo);
  }

  getNomeAtivo(ativo:any) {
    return this.restProvider.getNomeAtivo(ativo);
  }
  
  ionViewWillEnter() {
    let loading = this.loadingCtrl.create({
      content: 'Aguarde...'
    });
    loading.present();    
    this.ranking = "congestao";
    this.ativosStorage = [];
    this.ativos = [];
    this.restProvider.getSymbols(`bovespa`,`15min`).forEach((symbol, index) => {
      this.ativosStorage.push(this.storage.get(symbol));
    });

    this.todosAtivos = [];
    this.storage.ready().then(() => {
      forkJoin(this.ativosStorage).subscribe(results => {
        results.forEach((ativo) => {
          this.todosAtivos.push(ativo);
          this.daytradeSetup.verificarSetup(ativo, `IBOV`);
        });
        this.selecionouCongestao();
        loading.dismiss();

      });
    });
  }

  numeroCandlesDoDia(ativo) {
    let num:number = 0;
    let ultimoDia = this.restProvider.getUltimoDiaPregao();
    let ultimoDiaStr = this.restProvider.formataData(ultimoDia);
    for (const key in ativo.min15) {
      if (key.startsWith(ultimoDiaStr)) {
        num++;
      }
    }
    return num;
  }

  private obterPossiveisAtivos() {
    let ativosDoSetup = [];
    this.ativos.forEach((item) => {
      ativosDoSetup.push(item.symbol);
    })
    return ativosDoSetup;
  }

  lerContraGap(fonte:string) {
    let ativosDoSetup: Array<string> = [];
    ativosDoSetup = this.obterPossiveisAtivos();
    if (ativosDoSetup.length == 0) {
      return;
    }   
    this.events.publish('lerAtivosContraGap', ativosDoSetup, fonte); 
  }

  compareVolume(a,b) {
    if (a.volumeProjetado < b.volumeProjetado) {
      return 1;
    } else if (a.volumeProjetado > b.volumeProjetado) {
      return -1;
    }
    return 0;
  }

  selecionouCongestao() {
    this.ativos = [];
    this.todosAtivos.forEach((ativo) => {
      if (ativo.congestao && ativo.volumeProjetado > 0) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a,b) => this.compareVolume(a,b));
  }

  selecionouContraGap() {
    this.ativos = [];
    this.todosAtivos.forEach((ativo) => {
      if (ativo.volumeProjetado > 0) {
        if (ativo.contraGap) {
          this.ativos.push(ativo);
        }
        if (ativo.possivelSetupContraGap) {
          this.ativos.push(ativo);
        }
      }
    });
  }

  selecionouVolume() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if (ativo.volumeProjetado > 0) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareVolume(a, b));
  }

  selecionouGap() {
    this.ativos.length = 0;
    this.todosAtivos.forEach((ativo) => {
      if (ativo.volumeProjetado > 0 && Math.abs(ativo.gap) > 1) {
        this.ativos.push(ativo);
      }
    });
    this.ativos.sort((a, b) => this.compareGap(a, b));
  }

  compareGap(a, b) {
    if (Math.abs(a.gap) < Math.abs(b.gap)) {
      return 1;
    } else if (Math.abs(a.gap) > Math.abs(b.gap)) {
      return -1;
    }
    return 0;
  }

  segmentChanged(event) {
    if (event.value == `gap`) {
      this.selecionouGap();
    } else if (event.value == `volume`) {
      this.selecionouVolume();
    } else if (event.value == `congestao`) {
      this.selecionouCongestao();
    } else if (event.value == `contraGap`) {
      this.selecionouContraGap();
    }
  }

  
}


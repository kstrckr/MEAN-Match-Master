import { Injectable, OnInit } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/toPromise';

import { PieceState } from '../models/piece-list';

@Injectable()

export class GameStateService implements OnInit {

    playerInitials: string;
    boardId: string;
    currentScore: number = 0;
    currentScoreSource: BehaviorSubject<number> = new BehaviorSubject(this.currentScore);
    currentScore$ = this.currentScoreSource.asObservable();
// selectedPieces only reflects the currently selected pieces and has a max length of 2
    selectedPieces: PieceState[] = [];
// boardState represents all pieces on the board at each stage of the game cycle
    boardState: PieceState[] = [];
    postUrl: string = `/api/log-score`;
    putUrl: string = `/api/win`;

    constructor( private http: Http) {};

// called from game-board.components (click)="getTileValue()"
    getTileContents(boardId, tileIndex): Promise<string> {
        // const url = 'http://localhost:3000';
        const fullUrl = `/api/checkmatch/${boardId}/${tileIndex}`;
        return this.http.get(fullUrl)
            .toPromise()
            .then(res => {
                this.boardState[tileIndex].value = res.json();
                this.boardState[tileIndex].selected = true;
                return res.json() as string;
                }
            );
    }

    isSelected(tileIndex): boolean {
        return this.boardState[tileIndex].selected
    }

    isMatched(tileIndex): boolean {
        return this.boardState[tileIndex].matched;
    }

    setScore(increment): void {
        this.currentScore += increment;
        this.currentScoreSource.next(this.currentScore);
    }

    updateSelectedPieces(boardState) {
       this.selectedPieces = boardState.filter((piece) => {
            return piece.selected === true;
        })
    }

    matchCheck() {
        const selectedPieceA = this.selectedPieces[0];
        const selectedPieceB = this.selectedPieces[1];
        if (selectedPieceA.value !== '' && selectedPieceB.value !== '') {
            if (selectedPieceA.value === selectedPieceB.value) {
            selectedPieceA.matched = true;
            selectedPieceA.selected = false;
            selectedPieceB.matched = true;
            selectedPieceB.selected = false;
            // console.log(this.boardState);
            return true;
            }
        } else {
            return false;
        }
    }

    winCheck() {
        const matchTiles = this.boardState.filter((piece) => piece.matched === true)
        if (matchTiles.length === this.boardState.length) {
            this.saveScoreWithPromise();
            this.updateBoardWithWinTime();
            // console.log(`${this.playerInitials} is a Match Master! with a score of ${this.currentScore}`);
            return true;
        }
    }

    updateBoardWithWinTime(): Promise<any> {
        // console.log(this.boardId);
        const body = {
            id: this.boardId
        }
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const options = new RequestOptions({ headers: headers });
        return this.http.put(this.putUrl, body, options).toPromise().then(function(){
            console.log(`board ${this.boardId} updated with win time`);
        });
    }

    saveScoreWithPromise(): Promise<any> {
        const body = {
            initials: this.playerInitials,
            score: this.currentScore,
            boardId: 'temp-id'
        }
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const options = new RequestOptions({ headers: headers });
        return this.http.post(this.postUrl, body, options).toPromise().then();
    }

    resetNonMatches(piecesInDom) {
        const selectedPieceA = this.selectedPieces[0];
        const selectedPieceB = this.selectedPieces[1];

        selectedPieceA.selected = false;
        selectedPieceB.selected = false;

        selectedPieceA.value = '';
        selectedPieceB.value = '';

        if (selectedPieceA.matched === false && selectedPieceB .matched === false) {
        piecesInDom[selectedPieceA.pieceId].nativeElement.innerHTML = '<p></p>'
        piecesInDom[selectedPieceB.pieceId].nativeElement.innerHTML = '<p></p>'
        }

        // console.log(this.boardState);
    }

    resetEntireBoard() {
        this.boardState = [];
        this.currentScore = 0;
    }

    ngOnInit(): void {
    }

}

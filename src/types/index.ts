export interface Card {
  cardId: number;
  programId: number;
  programName: string;
  merchantName: string;
  rewardName: string;
  stampsCount: number;
  stampsNeeded: number;
  status: 'ACTIVE' | 'INACTIVE' | 'REDEEMED';
  hasReward: boolean;
}

export interface CustomerCardsResponse {
  cards: Card[];
}

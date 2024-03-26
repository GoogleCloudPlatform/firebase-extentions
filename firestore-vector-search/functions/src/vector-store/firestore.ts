import {Query, VectorQuery} from '@google-cloud/firestore';
import * as admin from 'firebase-admin';
import {Prefilter} from '../queries/util';
import {VectorStoreClient} from './base_class';

export class FirestoreVectorStoreClient extends VectorStoreClient {
  firestore: admin.firestore.Firestore;
  distanceMeasure: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  constructor(
    firestore: admin.firestore.Firestore,
    distanceMeasure: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT' = 'COSINE'
  ) {
    super(firestore);
    this.firestore = firestore;
    this.distanceMeasure = distanceMeasure;
  }

  cosineDistance(v1: number[], v2: number[]): number {
    const dotProduct = this.dotProduct(v1, v2);
    const v1Magnitude = Math.sqrt(v1.reduce((acc, cur) => acc + cur * cur, 0));
    const v2Magnitude = Math.sqrt(v2.reduce((acc, cur) => acc + cur * cur, 0));

    return 1 - dotProduct / (v1Magnitude * v2Magnitude);
  }

  euclideanDistance(v1: number[], v2: number[]): number {
    return Math.sqrt(
      v1.reduce((acc, cur, i) => acc + Math.pow(cur - v2[i], 2), 0)
    );
  }

  dotProduct(v1: number[], v2: number[]): number {
    return v1.reduce((acc, cur, i) => acc + cur * v2[i], 0);
  }

  calculateDistance(v1: number[], v2: number[]): number {
    if (this.distanceMeasure === 'COSINE') {
      return this.cosineDistance(v1, v2);
    } else if (this.distanceMeasure === 'EUCLIDEAN') {
      return this.euclideanDistance(v1, v2);
    } else if (this.distanceMeasure === 'DOT_PRODUCT') {
      return this.dotProduct(v1, v2);
    } else {
      throw new Error('Invalid distance measure');
    }
  }

  async query(
    query: number[],
    collection: string,
    prefilters: Prefilter[],
    limit: number,
    outputField: string
  ): Promise<{id: string; distance?: number}[]> {
    const col = this.firestore.collection(collection);

    let q: Query | VectorQuery = col;

    if (prefilters.length > 0) {
      for (const p of prefilters) {
        q = q.where(p.field, p.operator, p.value);
      }
    }

    q = q.findNearest(outputField, query, {
      limit,
      distanceMeasure: this.distanceMeasure,
    });

    const result = await q.get();

    const queryResult = result.docs.map(doc => {
      if (!doc.data()[outputField]._values) {
        throw new Error(
          `Document ${doc.id} does not have a field ${outputField}._values`
        );
      }

      const resultVector = doc.data()[outputField]._values;

      if (resultVector.length !== query.length) {
        throw new Error(
          `Query vector length (${query.length}) does not match document vector length (${resultVector.length})`
        );
      }

      let distance: number | undefined;
      try {
        distance = this.calculateDistance(query, resultVector);
      } catch (e) {
        console.log('Error calculating distance:', e);
      }

      return {
        id: doc.ref.id,
        distance,
      };
    });

    return queryResult;
  }
}

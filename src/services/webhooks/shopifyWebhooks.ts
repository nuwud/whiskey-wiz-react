import { collection, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { shopifyService } from '../shopifyService';
import { WhiskeySample } from '../../types/game';

interface WebhookHandlers {
  [key: string]: (data: any) => Promise<void>;
}

class ShopifyWebhookHandler {
  private readonly productsCollection = collection(db, 'shopify_products');
  private readonly quartersCollection = collection(db, 'quarters');

  private handlers: WebhookHandlers = {
    'products/create': this.handleProductCreate.bind(this),
    'products/update': this.handleProductUpdate.bind(this),
    'products/delete': this.handleProductDelete.bind(this)
  };

  async handleWebhook(topic: string, data: any) {
    const handler = this.handlers[topic];
    if (handler) {
      await handler(data);
    }
  }

  private async handleProductCreate(data: any) {
    // Store product data
    const productRef = doc(this.productsCollection, data.id);
    await setDoc(productRef, {
      ...data,
      lastUpdated: new Date()
    });

    // Check if this should be added to any quarters
    const validation = await shopifyService.validateMetafields(data.id);
    if (validation.isValid) {
      const sample = shopifyService.convertToSample({
        id: data.id,
        title: data.title,
        handle: data.handle,
        vendor: data.vendor,
        metafields: data.metafields
      });

      // Add to active quarters if configured
      const activeQuarters = await shopifyService.getQuartersForProduct(data.id);
      for (const quarterId of activeQuarters) {
        const quarterRef = doc(this.quartersCollection, quarterId);
        const quarterDoc = await getDoc(quarterRef);
        if (quarterDoc.exists()) {
          const samples = quarterDoc.data().samples || [];
          samples.push(sample);
          await updateDoc(quarterRef, { samples });
        }
      }
    }
  }

  private async handleProductUpdate(data: any) {
    // Update product data
    const productRef = doc(this.productsCollection, data.id);
    await setDoc(productRef, {
      ...data,
      lastUpdated: new Date()
    }, { merge: true });

    // Update any quarters using this product
    const validation = await shopifyService.validateMetafields(data.id);
    if (validation.isValid) {
      const sample = shopifyService.convertToSample({
        id: data.id,
        title: data.title,
        handle: data.handle,
        vendor: data.vendor,
        metafields: data.metafields
      });

      const quarters = await shopifyService.getQuartersForProduct(data.id);
      for (const quarterId of quarters) {
        const quarterRef = doc(this.quartersCollection, quarterId);
        const quarterDoc = await getDoc(quarterRef);
        if (quarterDoc.exists()) {
          const samples = quarterDoc.data().samples.map((s: WhiskeySample) => 
            s.shopifyId === data.id ? { ...s, ...sample } : s
          );
          await updateDoc(quarterRef, { samples });
        }
      }
    }
  }

  private async handleProductDelete(data: any) {
    // Mark product as deleted
    const productRef = doc(this.productsCollection, data.id);
    await setDoc(productRef, {
      deleted: true,
      deletedAt: new Date()
    }, { merge: true });

    // Remove from any active quarters
    const quarters = await shopifyService.getQuartersForProduct(data.id);
    for (const quarterId of quarters) {
      const quarterRef = doc(this.quartersCollection, quarterId);
      const quarterDoc = await getDoc(quarterRef);
      if (quarterDoc.exists()) {
        const samples = quarterDoc.data().samples.filter(
          (s: WhiskeySample) => s.shopifyId !== data.id
        );
        await updateDoc(quarterRef, { samples });
      }
    }
  }
}

export const shopifyWebhookHandler = new ShopifyWebhookHandler();
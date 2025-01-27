import { useState, useEffect } from 'react';
import { WhiskeySample } from '../../types/game.types';
import { Dialog } from '@/components/ui/dialog';
import { shopifyService } from 'src/services/shopify-integration.service';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  metafields: {
    age?: string;
    proof?: string;
    mashbill?: string;
    description?: string;
  };
}

interface SampleFormData {
  name: string;
  age: number;
  proof: number;
  mashbill: string;
  distillery: string;
  description: string;
}

const defaultSampleData: SampleFormData = {
  name: '',
  age: 0,
  proof: 80,
  mashbill: '',
  distillery: '',
  description: ''
};

interface SampleEditorProps {
  samples: WhiskeySample[];
  onUpdate: (samples: WhiskeySample[]) => void;
  onClose: () => void;
}

export const SampleEditor = ({ samples, onUpdate, onClose }: SampleEditorProps) => {
  const [editingSample, setEditingSample] = useState<SampleFormData>(defaultSampleData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    loadShopifyProducts();
  }, []);

  const loadShopifyProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductError(null);
      const products = await shopifyService.getProduct();
      setShopifyProducts(products);
    } catch (err) {
      setProductError('Failed to load Shopify products');
      console.error('Error loading Shopify products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductSelect = async (productId: string) => {
    try {
      const product = shopifyProducts.find(p => p.id === productId);
      if (!product) return;

      const validation = await shopifyService.validateMetafields(productId);
      if (!validation.isValid) {
        throw new Error(`Missing product details: ${validation.missing.join(', ')}`);
      }

      const sampleData = shopifyService.convertToSample(product);
      setEditingSample({
        name: sampleData.name || '',
        age: sampleData.age || 0,
        proof: sampleData.proof || 80,
        mashbill: sampleData.mashbill || '',
        distillery: sampleData.distillery || '',
        description: sampleData.description || ''
      });
    } catch (err) {
      console.error('Error loading product details:', err);
      // Keep the error message displayed briefly
      setProductError(err instanceof Error ? err.message : 'Failed to load product details');
      setTimeout(() => setProductError(null), 3000);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Shopify Product Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Select from Shopify</h3>
              {isLoadingProducts ? (
                <div className="flex justify-center">
                  <div className="animate-spin h-6 w-6 border-t-2 border-amber-600 rounded-full" />
                </div>
              ) : productError ? (
                <div className="text-red-600 text-sm">{productError}</div>
              ) : (
                <select
                  title="Select from Shopify"
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                >
                  <option value="">Select a Product</option>
                  {shopifyProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title} ({product.vendor})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sample List */}
            <div className="flex flex-col space-y-4">
              {samples.map((sample, index) => (
                <div key={sample.id || index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-900">{sample.name}</div>
                    <div className="text-sm text-gray-500">{sample.distillery}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSample(sample);
                      setEditingIndex(index);
                    }}
                    className="text-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSamples = [...samples];
                      updatedSamples.splice(index, 1);
                      onUpdate(updatedSamples);
                    }}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}